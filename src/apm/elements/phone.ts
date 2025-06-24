module ProcessOut {
  export interface PhoneProps extends Omit<Props<'input'>, 'value' | 'oninput' | 'onblur'> {
    label?: string;
    errored?: boolean;
    dialing_codes: Array<{
      region_code: string,
      value: string,
      name: string,
    }>
    oninput?: (key: string, value: { dialing_code: string, value: string }) => void,
    onblur?: (key: string, value: { dialing_code: string, value: string }) => void,
    value?: { dialing_code: string, value: string },
  }

  const { div, label: labelEl, img, input, select, option } = elements

  let state = {
    dialing_code: '',
    value: '',
    iso: ''
  }

  let phoneRef: HTMLInputElement = null;
  let dialingCodesRef: HTMLSelectElement = null;
  let focusMethod = 'mouse';

  const updateFilledState = (el: HTMLInputElement) => {
    const value = el.value

    if (value.length === 0) {
      el.parentElement.classList.remove("filled")
    } else {
      el.parentElement.classList.add("filled")
    }
  }

  const getDialingCode = (dialingCode: string) => {
    return `${dialingCode} `;
  }

  const getNumber = (number: string) => {
    // This regex matches 3 digits (\d{3}) but only if they are followed by
    // at least 2 more digits (?=\d{2,}). This prevents creating a final group of 1.
    // '$1 ' adds a space after the matched group.
    const regex = /(\d{3})(?=\d{2,})/g;
    return number.replace(regex, '$1 ');
  }

  const getFullNumber = (dialingCode: string, number: string) => {
    return `${getDialingCode(dialingCode)}${getNumber(number)}`
  }

  export const Phone = ({ dialing_codes, name, oninput, onblur, disabled, label, errored, className, value, id, ...props }: PhoneProps) => {
    state = value ? { ...value, iso: '' } : state

    state.dialing_code = state.dialing_code || dialing_codes[0].value;
    state.iso = state.iso || dialing_codes.find(item => item.value === state.dialing_code).region_code;

    const classNames = [
      "field phone filled",
      disabled && 'disabled',
      label && 'has-label',
      errored && 'errored',
      className
    ].filter(Boolean).join(" ")


    const handleInputChange = e => {
      const input = e.target as HTMLInputElement;
      const dialingCode = state.dialing_code;
      const numberStartIndex = dialingCode.length + 1;

      const currentValue = input.value;
      const cursorPosition = input.selectionStart;

      // --- 2. Calculate cursor's position within the numeric part ---
      // How many digits are to the left of the cursor, ignoring the prefix?
      const charsBeforeCursor = currentValue.substring(0, cursorPosition);
      let cursorPositionInDigits = (charsBeforeCursor.match(/\d/g) || []).length;

      // If the cursor is in the dialing code, its logical position in the number is 0.
      const dialingCodeDigits = (dialingCode.match(/\d/g) || []).length;
      cursorPositionInDigits = Math.max(0, cursorPositionInDigits - dialingCodeDigits);

      const allDigits = (currentValue.match(/\d/g) || []).join('');
      const cleanNumber = allDigits.substring(dialingCodeDigits);
      const formattedValue = getFullNumber(dialingCode, cleanNumber);

      let newCursorPosition = numberStartIndex;
      let digitsCounted = 0;

      for (const char of formattedValue.substring(numberStartIndex)) {
        if (digitsCounted === cursorPositionInDigits) {
          break;
        }
        if (/\d/.test(char)) {
          digitsCounted++;
        }
        newCursorPosition++;
      }

      input.value = formattedValue;
      if (label) {
        updateFilledState(input);
      }

      if (currentValue.length < getDialingCode(dialingCode).length) {
        dialingCodesRef.focus()
        dialingCodesRef.showPicker()
        return
      }

      if (state.value !== cleanNumber) {
        state.value = cleanNumber;
        oninput && oninput(name, state);
      }

      input.setSelectionRange(newCursorPosition, newCursorPosition);
    }

    const handleInputClick = e => {
      const target = e.target as HTMLInputElement

      if (target.selectionStart <= state.dialing_code.length && target.selectionEnd === target.selectionStart) {
        dialingCodesRef.focus();
        dialingCodesRef.showPicker()
      }
    }

    const handleInputFocus = e => {
      const target = e.target as HTMLInputElement
      target.parentElement.classList.add("focused")
      const value = target.value;

      if (focusMethod === 'keyboard') {
        target.selectionStart = state.dialing_code.length + 1;
        target.selectionEnd = value.length;
      }
    }

    const handleInputBlur = e => {
      const target = e.target as HTMLInputElement
      target.parentElement.classList.remove("focused")

      if (e.relatedTarget !== dialingCodesRef) {
        onblur && onblur(name, state)
      }
    }

    const handleSelectChange = e => {
      const currentValue = (e.target as HTMLSelectElement).value;
      const cleanNumber = state.value.replace(state.dialing_code, '').replace(/ /g, '');

      state.dialing_code = dialing_codes.find(item => item.region_code === currentValue).value
      state.iso = currentValue;
      phoneRef.value = getFullNumber(state.dialing_code, cleanNumber);
      phoneRef.focus();
      oninput && oninput(name, state);

      (e.target as HTMLSelectElement).parentElement.querySelector('img').src = `https://flagcdn.com/w80/${currentValue.toLowerCase()}.jpg`;
    }

    const handleSelectFocus = e => {
      const target = e.target as HTMLSelectElement
      target.parentElement.classList.add("focused")
      target.parentElement.querySelector('.dialing-code').classList.add('open')
    }

    const handleSelectBlur = e => {
      const target = e.target as HTMLSelectElement
      target.parentElement.classList.remove("focused")
      target.parentElement.querySelector('.dialing-code').classList.remove('open')
      if (e.relatedTarget !== phoneRef) {
        onblur && onblur(name, state)
      }
    }

    const handleKeyDown = (e) => {
      const isKeyTab = e.key === 'Tab' || e.keyCode === 9;
      const isKeyArrowLeft = e.key === 'ArrowLeft' || e.keyCode === 37;
      const isFocusedOnPhoneInput = ContextImpl.context.page.getActiveElement() === phoneRef;
      const isSelectionOnDialingCode = phoneRef.selectionStart <= getDialingCode(state.dialing_code).length;

      if (isKeyTab) {
        focusMethod = 'keyboard';
      }

      if (isKeyArrowLeft && isFocusedOnPhoneInput && isSelectionOnDialingCode) {
        phoneRef.setSelectionRange(getDialingCode(state.dialing_code).length + 1, getDialingCode(state.dialing_code).length + 1);
      }
    }

    const handleMouseDown = () => {
      focusMethod = 'mouse';
    }

    return div(
      {
        className: classNames,
      },
      label && labelEl({ className: "label", htmlFor: id || `${name}.value` }, label),
      div(
        { className: "dialing-code" },
        div(
          { className: "dialing-code-label" },
          img({
            width: 22,
            alt: `Selected ${dialing_codes.find(item => item.value === state.dialing_code).name} dialing code`,
            src: `https://flagcdn.com/w80/${dialing_codes.find(item => item.value === state.dialing_code).region_code.toLowerCase()}.jpg`,
          }),
        ),
        div(
          { className: "select-chevrons" },
          div({
            className: "chevron up",
          }),
          div({
            className: "chevron down",
          }),
        ),
      ),
      input({
        type: "tel",
        autocomplete: "tel",
        value: getFullNumber(state.dialing_code, state.value),
        inputMode: "tel",
        name: `${name}.value`,
        disabled,
        id: id || `${name}.value`,
        ref: el => (phoneRef = el),
        oninput: handleInputChange,
        onfocus: handleInputFocus,
        onblur: handleInputBlur,
        onclick: handleInputClick,
        onmousedown: handleMouseDown,
        onkeydown: handleKeyDown,
        ...props,
      }),
      select(
        {
          name:`${name}.dialing_code`,
          disabled,
          'aria-label': "Select country prefix",
          ref: el => (dialingCodesRef = el),
          onchange: handleSelectChange,
          onfocus: handleSelectFocus,
          onblur: handleSelectBlur,
        },
        option(
          {
            value: "",
            disabled: true,
          },
          "Select number prefix",
        ),
        ...dialing_codes.map(({ name, value, region_code }) =>
          option(
            {
              value: region_code,
              selected: state.iso === region_code,
            },
            `${name} (${value})`,
          ),
        ),
      ),
    )
  }

  export const COUNTRY_DICT = {
    "AF": "Afghanistan",
    "AX": "Åland Islands",
    "AL": "Albania",
    "DZ": "Algeria",
    "AS": "American Samoa",
    "AD": "Andorra",
    "AO": "Angola",
    "AI": "Anguilla",
    "AQ": "Antarctica",
    "AG": "Antigua And Barbuda",
    "AR": "Argentina",
    "AM": "Armenia",
    "AW": "Aruba",
    "AU": "Australia",
    "AT": "Austria",
    "AZ": "Azerbaijan",
    "BS": "Bahamas",
    "BH": "Bahrain",
    "BD": "Bangladesh",
    "BB": "Barbados",
    "BY": "Belarus",
    "BE": "Belgium",
    "BZ": "Belize",
    "BJ": "Benin",
    "BM": "Bermuda",
    "BT": "Bhutan",
    "BO": "Bolivia",
    "BQ": "Bonaire, Sint Eustatius And Saba",
    "BA": "Bosnia-herzegovina",
    "BW": "Botswana",
    "BV": "Bouvet Island",
    "BR": "Brazil",
    "IO": "British Indian Ocean Territory",
    "VG": "British Virgin Islands",
    "BN": "Brunei Darussalam",
    "BG": "Bulgaria",
    "BF": "Burkina Faso",
    "BI": "Burundi",
    "KH": "Cambodia",
    "CM": "Cameroon",
    "CA": "Canada",
    "CV": "Cape Verde",
    "KY": "Cayman Islands",
    "CF": "Central African Republic",
    "TD": "Chad",
    "CL": "Chile",
    "CN": "China",
    "CX": "Christmas Island",
    "CC": "Cocos (keeling) Islands",
    "CO": "Colombia",
    "KM": "Comoros",
    "CG": "Congo (brazzaville)",
    "CD": "Congo, The Democratic Republic",
    "CK": "Cook Islands",
    "CR": "Costa Rica",
    "HR": "Croatia",
    "CU": "Cuba",
    "CW": "Curacao",
    "CY": "Cyprus",
    "CZ": "Czech Republic",
    "DK": "Denmark",
    "DJ": "Djibouti",
    "DM": "Dominica",
    "DO": "Dominican Republic",
    "EC": "Ecuador",
    "EG": "Egypt",
    "SV": "El Salvador",
    "GQ": "Equatorial Guinea",
    "ER": "Eritrea",
    "EE": "Estonia",
    "SZ": "Eswatini",
    "ET": "Ethiopia",
    "FK": "Falkland Islands (malvinas)",
    "FO": "Faroe Islands",
    "FJ": "Fiji",
    "FI": "Finland",
    "FR": "France",
    "GF": "French Guiana",
    "PF": "French Polynesia",
    "TF": "French Southern Territories",
    "GA": "Gabon",
    "GM": "Gambia",
    "GE": "Georgia",
    "DE": "Germany",
    "GH": "Ghana",
    "GI": "Gibraltar",
    "GR": "Greece",
    "GL": "Greenland",
    "GD": "Grenada",
    "GP": "Guadeloupe",
    "GU": "Guam",
    "GT": "Guatemala",
    "GG": "Guernsey",
    "GN": "Guinea",
    "GW": "Guinea Bissau",
    "GY": "Guyana",
    "HT": "Haiti",
    "HM": "Heard Island And Mcdonald Islands",
    "HN": "Honduras",
    "HK": "Hong Kong",
    "HU": "Hungary",
    "IS": "Iceland",
    "IN": "India",
    "ID": "Indonesia",
    "IR": "Iran",
    "IQ": "Iraq",
    "IE": "Ireland",
    "IM": "Isle Of Man",
    "IL": "Israel",
    "IT": "Italy",
    "CI": "Ivory Coast (côte D'ivoire)",
    "JM": "Jamaica",
    "JP": "Japan",
    "JE": "Jersey",
    "JO": "Jordan",
    "KZ": "Kazakhstan",
    "KE": "Kenya",
    "KI": "Kiribati",
    "KP": "Korea, North",
    "KR": "Korea, South",
    "XK": "Kosovo",
    "KW": "Kuwait",
    "KG": "Kyrgyzstan",
    "LA": "Laos",
    "LV": "Latvia",
    "LB": "Lebanon",
    "LS": "Lesotho",
    "LR": "Liberia",
    "LY": "Libya",
    "LI": "Liechtenstein",
    "LT": "Lithuania",
    "LU": "Luxembourg",
    "MO": "Macau",
    "MK": "Macedonia, North",
    "MG": "Madagascar",
    "MW": "Malawi",
    "MY": "Malaysia",
    "MV": "Maldives",
    "ML": "Mali",
    "MT": "Malta",
    "MH": "Marshall Islands",
    "MQ": "Martinique",
    "MR": "Mauritania",
    "MU": "Mauritius",
    "YT": "Mayotte",
    "MX": "Mexico",
    "FM": "Micronesia",
    "MD": "Moldova",
    "MC": "Monaco",
    "MN": "Mongolia",
    "ME": "Montenegro",
    "MS": "Montserrat",
    "MA": "Morocco",
    "MZ": "Mozambique",
    "MM": "Myanmar",
    "NR": "Nauru",
    "NP": "Nepal",
    "NL": "Netherlands",
    "NC": "New Caledonia",
    "NZ": "New Zealand",
    "NI": "Nicaragua",
    "NE": "Niger",
    "NG": "Nigeria",
    "NU": "Niue",
    "NF": "Norfolk Island",
    "MP": "Northern Mariana Islands",
    "NO": "Norway",
    "OM": "Oman",
    "PK": "Pakistan",
    "PW": "Palau",
    "PS": "Palestinian Territory",
    "PA": "Panama",
    "PG": "Papua New Guinea",
    "PY": "Paraguay",
    "PE": "Peru",
    "PH": "Philippines",
    "PN": "Pitcairn",
    "PL": "Poland",
    "PT": "Portugal",
    "PR": "Puerto Rico",
    "QA": "Qatar",
    "RE": "Reunion",
    "RO": "Romania",
    "RU": "Russia",
    "RW": "Rwanda",
    "SH": "Saint Helena, Ascension And Tristan Da Cunha",
    "KN": "Saint Kitts And Nevis",
    "MF": "Saint Martin",
    "PM": "Saint Pierre And Miquelon",
    "VC": "Saint Vincent And The Grenadines",
    "BL": "Saint-barthelemy",
    "WS": "Samoa",
    "SM": "San Marino",
    "ST": "Sao Tome And Principe",
    "SA": "Saudi Arabia",
    "SN": "Senegal",
    "RS": "Serbia",
    "SC": "Seychelles",
    "SL": "Sierra Leone",
    "SG": "Singapore",
    "SK": "Slovakia",
    "SI": "Slovenia",
    "SB": "Solomon Islands",
    "SO": "Somalia",
    "ZA": "South Africa",
    "GS": "South Georgia And The South Sandwith Islands",
    "SS": "South Sudan",
    "ES": "Spain",
    "LK": "Sri Lanka",
    "LC": "St Lucia",
    "SX": "St Maarten",
    "SD": "Sudan",
    "SR": "Suriname",
    "SJ": "Svalbard And Jan Mayen",
    "SE": "Sweden",
    "CH": "Switzerland",
    "SY": "Syria",
    "TW": "Taiwan, Republic Of China",
    "TJ": "Tajikistan",
    "TZ": "Tanzania",
    "TH": "Thailand",
    "TL": "Timor-leste",
    "TG": "Togo",
    "TK": "Tokelau",
    "TO": "Tonga",
    "TT": "Trinidad And Tobago",
    "TN": "Tunisia",
    "TR": "Turkey",
    "TM": "Turkmenistan",
    "TC": "Turks And Caicos Islands",
    "TV": "Tuvalu",
    "UG": "Uganda",
    "UA": "Ukraine",
    "AE": "United Arab Emirates",
    "GB": "United Kingdom",
    "US": "United States",
    "UM": "United States Minor Outlying Islands",
    "VI": "United States Virgin Islands",
    "UY": "Uruguay",
    "UZ": "Uzbekistan",
    "VU": "Vanuatu",
    "VA": "Vatican City",
    "VE": "Venezuela",
    "VN": "Vietnam",
    "WF": "Wallis And Futuna",
    "EH": "Western Sahara",
    "YE": "Yemen",
    "ZM": "Zambia",
    "ZW": "Zimbabwe"
  }
}
