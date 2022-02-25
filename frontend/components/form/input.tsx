import { Input, Box, Text, colors } from '@airtable/blocks/ui';
import React from 'react';

const NiInput = ({value, label, onChange, onBlur, type = null, required = false }) => (
  <>
    <Box style={style.captionContainer}>
      <Text style={style.text}>{label}</Text>
      {required && <Text style={style.required}>*</Text>}
    </Box>
    <Input value={value.toString()} onChange={onChange} onBlur={onBlur} style={style.input} type={type} />
  </>
);

const style = {
  captionContainer: {
    display: 'flex',
  },
  text: {
    color: colors.GRAY,
    fontSize: 13,
    fontWeight: 500,
    marginBottom: 4,
    marginLeft: 4,
  },
  required: {
    color: colors.RED,
  },
  input: {
    marginBottom: 12,
  }
};

export default NiInput;
