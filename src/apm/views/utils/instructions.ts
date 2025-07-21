module ProcessOut {
  const { div } = elements

  export const Instruction = ({ instruction }: Omit<InstructionData, 'type'>) => {
    switch (instruction.type) {
      case "message": {
        if (instruction.label) {
          return CopyInstruction({ instruction })
        }

        return Markdown({ content: instruction.value })
      }
      case "barcode": {
        if (instruction.subtype === "qr") {
          return QR({ data: instruction.value, size: 600 })
        }
        return null
      }
    }
  }
}