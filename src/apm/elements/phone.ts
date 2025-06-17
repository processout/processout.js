module ProcessOut {
  export interface PhoneProps extends Omit<Props<HTMLElementTagNameMap['input']>, 'value' | 'oninput' | 'onblur'> {
    label?: string;
    errored?: boolean;
    dialingCodes: Array<{
      regionCode: string,
      value: string,
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

  export const Phone = ({ dialingCodes, name, oninput, onblur, disabled, label, errored, className, value, id, ...props }: PhoneProps) => {
    const options = dialingCodes
      .map((codes) => ({
        ...codes,
        name: COUNTRY_DICT[codes.regionCode] || codes.regionCode
      }))
      .sort((a, b) => {
        if (a.name < b.name) { return -1; }
        if (a.name > b.name) { return 1; }
        return 0;
      });

    state = value ? { ...value, iso: '' } : state
    state.dialing_code = state.dialing_code || options[0].value;
    state.iso = state.iso || dialingCodes.find(item => item.value === state.dialing_code).regionCode;

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

      if (state.value !== cleanNumber) {
        state.value = cleanNumber;
        oninput && oninput(name, state);
      }

      input.value = formattedValue;
      input.setSelectionRange(newCursorPosition, newCursorPosition);

      if (label) {
        updateFilledState(input);
      }
    }

    const handleInputClick = e => {
      const target = e.target as HTMLInputElement
      if (target.selectionStart < state.dialing_code.length + 1) {
        target.selectionStart = state.dialing_code.length + 1;
        target.selectionEnd = target.selectionEnd < state.dialing_code.length + 1 ? state.dialing_code.length + 1 : target.selectionEnd;
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

      state.dialing_code = dialingCodes.find(item => item.regionCode === currentValue).value
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

    document.addEventListener('keydown', function(e) {
      if (e.key === 'Tab' || e.keyCode === 9) {
        focusMethod = 'keyboard';
      }
    });

    document.addEventListener('mousedown', function() {
      focusMethod = 'mouse';
    });

    return div(
      {
        className: classNames,
      },
      label && labelEl({ className: "label" }, label),
      div(
        { className: "dialing-code" },
        div(
          { className: "dialing-code-label" },
          img({
            width: 22,
            src: `https://flagcdn.com/w80/${dialingCodes.find(item => item.value === state.dialing_code).regionCode.toLowerCase()}.jpg`,
          }),
        ),
        div(
          { className: "dialing-code-chevrons" },
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
        ...props,
      }),
      select(
        {
          name:`${name}.dialing_code`,
          disabled,
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
        ...options.map(({ name, value, regionCode }) =>
          option(
            {
              value: regionCode,
              selected: state.iso === regionCode,
            },
            `${name} (${value})`,
          ),
        ),
      ),
    )
  }

  const COUNTRY_DICT = {
    "AF": "Afghanistan",
    "AX": "Åland Islands",
    "AL": "Albania",
    "DZ": "Algeria",
    "AS": "American Samoa",
    "AD": "Andorra",
    "AO": "Angola",
    "AI": "Anguilla",
    "AQ": "Antarctica",
    "AG": "Antigua and Barbuda",
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
    "BQ": "Bonaire, Sint Eustatius and Saba",
    "BA": "Bosnia and Herzegovina",
    "BW": "Botswana",
    "BV": "Bouvet Island",
    "BR": "Brazil",
    "IO": "British Indian Ocean Territory",
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
    "CC": "Cocos (Keeling) Islands",
    "CO": "Colombia",
    "KM": "Comoros",
    "CG": "Congo",
    "CD": "Congo, The Democratic Republic of the",
    "CK": "Cook Islands",
    "CR": "Costa Rica",
    "CI": "Cote D'Ivoire",
    "HR": "Croatia",
    "CU": "Cuba",
    "CW": "Curaçao",
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
    "ET": "Ethiopia",
    "FK": "Falkland Islands",
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
    "GW": "Guinea-Bissau",
    "GY": "Guyana",
    "HT": "Haiti",
    "HM": "Heard Island and Mcdonald Islands",
    "VA": "Vatican City",
    "HN": "Honduras",
    "HK": "Hong Kong",
    "HU": "Hungary",
    "IS": "Iceland",
    "IN": "India",
    "ID": "Indonesia",
    "IR": "Iran",
    "IQ": "Iraq",
    "IE": "Ireland",
    "IM": "Isle of Man",
    "IL": "Israel",
    "IT": "Italy",
    "JM": "Jamaica",
    "JP": "Japan",
    "JE": "Jersey",
    "JO": "Jordan",
    "KZ": "Kazakhstan",
    "KE": "Kenya",
    "KI": "Kiribati",
    "KP": "Korea, Democratic People's Republic of",
    "KR": "Korea, Republic of",
    "KW": "Kuwait",
    "KG": "Kyrgyzstan",
    "LA": "Lao People's Democratic Republic",
    "LV": "Latvia",
    "LB": "Lebanon",
    "LS": "Lesotho",
    "LR": "Liberia",
    "LY": "Libyan Arab Jamahiriya",
    "LI": "Liechtenstein",
    "LT": "Lithuania",
    "LU": "Luxembourg",
    "MO": "Macao",
    "MK": "Macedonia",
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
    "NA": "Namibia",
    "NR": "Nauru",
    "NP": "Nepal",
    "NL": "Netherlands",
    "AN": "Netherlands Antilles",
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
    "PS": "Palestinian",
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
    "RU": "Russian Federation",
    "RW": "Rwanda",
    "BL": "Saint Barthélemy",
    "SH": "Saint Helena",
    "KN": "Saint Kitts and Nevis",
    "LC": "Saint Lucia",
    "MF": "Saint Martin",
    "PM": "Saint Pierre and Miquelon",
    "VC": "Saint Vincent and the Grenadines",
    "WS": "Samoa",
    "SM": "San Marino",
    "ST": "Sao Tome and Principe",
    "SA": "Saudi Arabia",
    "SN": "Senegal",
    "RS": "Serbia",
    "SC": "Seychelles",
    "SL": "Sierra Leone",
    "SG": "Singapore",
    "SX": "Sint Maarten",
    "SK": "Slovakia",
    "SI": "Slovenia",
    "SB": "Solomon Islands",
    "SO": "Somalia",
    "ZA": "South Africa",
    "GS": "South Georgia and the South Sandwich Islands",
    "SS": "South Sudan",
    "ES": "Spain",
    "LK": "Sri Lanka",
    "SD": "Sudan",
    "SR": "Suriname",
    "SJ": "Svalbard and Jan Mayen",
    "SZ": "Swaziland",
    "SE": "Sweden",
    "CH": "Switzerland",
    "SY": "Syrian Arab Republic",
    "TW": "Taiwan, Province of China",
    "TJ": "Tajikistan",
    "TZ": "Tanzania, United Republic of",
    "TH": "Thailand",
    "TL": "Timor-Leste",
    "TG": "Togo",
    "TK": "Tokelau",
    "TO": "Tonga",
    "TT": "Trinidad and Tobago",
    "TN": "Tunisia",
    "TR": "Turkey",
    "TM": "Turkmenistan",
    "TC": "Turks and Caicos Islands",
    "TV": "Tuvalu",
    "UG": "Uganda",
    "UA": "Ukraine",
    "AE": "United Arab Emirates",
    "GB": "United Kingdom",
    "US": "United States",
    "UM": "United States Minor Outlying Islands",
    "UY": "Uruguay",
    "UZ": "Uzbekistan",
    "VU": "Vanuatu",
    "VE": "Venezuela",
    "VN": "Viet Nam",
    "VG": "Virgin Islands, British",
    "VI": "Virgin Islands, U.S.",
    "WF": "Wallis and Futuna",
    "EH": "Western Sahara",
    "YE": "Yemen",
    "ZM": "Zambia",
    "ZW": "Zimbabwe"
  }
}
