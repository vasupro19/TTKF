/* eslint-disable */
import React from 'react'
import { useFormik } from 'formik'
import { useDispatch } from 'react-redux'
import {
  Tooltip,
  RadioGroup,
  FormControlLabel,
  Radio,
  Typography,
  IconButton,
  Box,
  Divider,
  Grid
} from '@mui/material'
import { HelpOutline as HelpOutlineIcon, Dns as DnsIcon, Rule as RuleIcon, SyncAlt } from '@mui/icons-material'
import CustomButton from '@/core/components/extended/CustomButton'
import { openSnackbar } from '@/app/store/slices/snackbar'
import ToggleSwitchWithLabels from '@/core/components/toggleSwitchWithLabels'

const PutAwayConfig = () => {
  const dispatch = useDispatch()

  const formik = useFormik({
    initialValues: {
      mode: 'Freehand',
      technique: 'Manual',
      criteria: {
        brand: false,
        category: false,
        weight: false,
        qcStatus: false,
        pickFace: false,
        dedicatedStorage: false
      }
    },
    onSubmit: values => {
      console.log('Form Data:', values)
      dispatch(
        openSnackbar({
          open: true,
          message: 'Configuration saved successfully!',
          variant: 'alert',
          alert: { color: 'success' },
          anchorOrigin: { vertical: 'top', horizontal: 'right' },
          autoHideDuration: 3000
        })
      )
      formik.resetForm()
    },
    validate: values => {
      const errors = {}
      return errors
    }
  })

  const isManual = formik.values.technique === 'Manual'

  const handleCriteriaChange = event => {
    const { name, checked } = event.target
    formik.setFieldValue(`criteria.${name}`, checked)
  }

  const SectionHeader = ({ title, tooltipText, icon, customStyles }) => (
    <div
      style={{
        backgroundColor: '#f5f5f5',
        padding: '4px 16px',
        borderBottom: '2px solid #e0e0e0',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        ...(customStyles||{})
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        {icon}
        <Typography variant="subtitle1" style={{ fontWeight: 'bold' }}>
          {title}
        </Typography>
      </div>
      <Tooltip title={tooltipText} arrow>
        <IconButton size="small" aria-label="help">
          <HelpOutlineIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    </div>
  )

  return (
      <Box>
          <Box sx={{ my: 1 }}>
              <Typography variant='h3'>Set Put Away Configuration</Typography>
              <Divider sx={{ marginTop: '0.2rem', borderColor: '#BCC1CA', borderWidth: '1px' }} />
          </Box>
          <Box
              sx={{
                  border: '1px solid',
                  borderColor: 'grey.borderLight',
                  borderRadius: '10px',
                  boxShadow: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
                  width: { sm: '60%', xs: '100%' },
                  marginX: { sm: 'auto', xs: 'unset' }
              }}
          >
              {/* Mode Section */}
              <SectionHeader
                  title='Mode'
                  tooltipText='Choose how the put-away process should work.'
                  icon={<DnsIcon color='primary' />}
                  customStyles={{
                      borderTopRightRadius: '10px',
                      borderTopLeftRadius: '10px'
                  }}
              />
              <Box padding='16px'>
                  <RadioGroup row name='mode' value={formik.values.mode} onChange={formik.handleChange}>
                      <FormControlLabel value='Freehand' control={<Radio />} label='Freehand' />
                      <FormControlLabel value='Job' control={<Radio />} label='Job' />
                      <FormControlLabel value='Both' control={<Radio />} label='Both' />
                  </RadioGroup>
              </Box>

              {/* Technique Section */}
              <SectionHeader
                  title='Techniques'
                  tooltipText='Select a technique for the put-away process.'
                  icon={<SyncAlt color='primary' />}
              />
              <Box padding='16px'>
                  <RadioGroup
                      row
                      name='technique'
                      value={formik.values.technique}
                      onChange={e => {
                          formik.handleChange(e)
                          if (e.target.value === 'Manual') {
                              formik.setFieldValue('criteria', {
                                  brand: false,
                                  category: false,
                                  weight: false,
                                  qcStatus: false,
                                  pickFace: false,
                                  dedicatedStorage: false
                              })
                          }
                      }}
                  >
                      <FormControlLabel value='Manual' control={<Radio />} label='Manual' />
                      <FormControlLabel value='Suggested' control={<Radio />} label='Suggested' />
                      <FormControlLabel value='Directed' control={<Radio />} label='Directed' />
                  </RadioGroup>
              </Box>

              {/* Criteria Section */}
              <SectionHeader
                  title='Criteria'
                  tooltipText='Define criteria for the put-away process.'
                  icon={<RuleIcon color='primary' />}
              />
              <Tooltip
                  title={isManual ? 'This section is disabled in manual mode' : ''}
                  disableHoverListener={!isManual}
              >
                  <fieldset
                      disabled={isManual}
                      style={{
                          padding: '16px',
                          opacity: isManual ? '0.5' : '1',
                          backgroundColor: '#fafafa',
                          borderRadius: '8px',
                          border: isManual ? '1px dashed #b0b0b0' : '1px solid transparent'
                      }}
                  >
                      <Grid container spacing={2}>
                          {['brand', 'category', 'weight', 'qcStatus', 'pickFace', 'dedicatedStorage'].map(name => (
                              <Grid item xs={12} sm={6} key={name}>
                                  <Box display='flex' alignItems='center' gap={1} sx={{
                                    pointerEvents:isManual?'none':'initial'
                                  }}>
                                      <Typography variant='body1' sx={{ minWidth: '100px' }}>
                                          {name.charAt(0).toUpperCase() + name.slice(1).replace(/([A-Z])/g, ' $1')} :
                                      </Typography>
                                      <ToggleSwitchWithLabels
                                          name={name}
                                          checked={formik.values.criteria[name]}
                                          onChange={handleCriteriaChange}
                                      />
                                  </Box>
                              </Grid>
                          ))}
                      </Grid>
                  </fieldset>
              </Tooltip>

              {/* Save Button */}
              <Box
                  sx={{
                      marginTop: '16px',
                      textAlign: 'right',
                      display: 'flex',
                      justifyContent: 'flex-end',
                      gap: 1,
                      paddingBottom: '8px',
                      paddingRight: '8px'
                  }}
              >
                  <CustomButton
                      type='button'
                      variant='outlined'
                      color='primary'
                      onClick={formik.resetForm}
                      customStyles={{ height: '2.25rem' }}
                  >
                      Reset
                  </CustomButton>
                  <CustomButton
                      type='button'
                      variant='clickable'
                      color='primary'
                      onClick={formik.submitForm}
                      customStyles={{ height: '2.25rem' }}
                  >
                      Save
                  </CustomButton>
              </Box>
          </Box>
      </Box>
  )
}

export default PutAwayConfig
