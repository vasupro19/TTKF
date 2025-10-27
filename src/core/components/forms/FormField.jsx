function FormField({ label, name, formik, type = 'text' }) {
    return (
        // eslint-disable-next-line react/jsx-no-undef
        <TextField
            fullWidth
            label={label}
            name={name}
            type={type}
            value={formik.values[name]}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            error={formik.touched[name] && Boolean(formik.errors[name])}
            helperText={formik.touched[name] && formik.errors[name]}
            sx={{
                '& .MuiFormHelperText-root': {
                    minHeight: '1.5em',
                    lineHeight: '1.5em'
                }
            }}
        />
    )
}
export default FormField
