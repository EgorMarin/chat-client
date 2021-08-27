import React, { useState } from 'react'
import { DatePicker, Modal, notification, TimePicker } from 'antd'
import moment from 'moment'

import './styles.scss'

const ScheduleMessageModal = ({ visible, onSendMsg, onClose }) => {
  const [isToday, setIsToday] = useState(false)
  const [isCurrentHour, setIsCurrentHour] = useState(false)
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedTime, setSelectedTime] = useState(null)

  const onSubmit = () => {
    const date = moment(selectedDate).format('YYYY-MM-DD')
    const time = moment(selectedTime).format('HH:mm')
    const dateTime = date + " " + time
    const selectedDateTime = moment(dateTime)
    const currentDateTime = moment()

    if (selectedDateTime > currentDateTime) {
      onSendMsg(dateTime)
      onClose()
    } else {
      notification.error({
        message: 'Selected date is erlier than current date! Please choose another time.'
      })
    }
  }

  const onSelectDate = (date, dateString) => {
    const today = moment().format('YYYY-MM-D')

    if (today === dateString) {
      setIsToday(true)
    } else {
      setIsToday(false)
    }
    
    setSelectedTime(null)
    setSelectedDate(date)
  }

  const onSelectTime = (time) => {
    const currentHour = moment(time).hour() === moment().hour()

    if (isToday && currentHour) {
      setIsCurrentHour(true)
    } else {
      setIsCurrentHour(false)
    }

    setSelectedTime(time)
  }

  const disabledDate = (current) => {
    return current && current < moment().add(-1, 'days')
  }

  const disabledHours = () => {
    const hours = []

    if (isToday) {
      for (let i = 0; i < moment().hour(); i++) {
        hours.push(i);
      }
    }

    return hours
  }

  const disabledMinutes = () => {
    const minutes = []

    if (isCurrentHour) {
      for (let i = 0; i < moment().minutes() + 1; i++) {
        minutes.push(i);
      }
    }

    return minutes
  }

  return (
    <Modal
      visible={visible}
      title="Sending time"
      okButtonProps={{
        disabled: !selectedDate || !selectedTime
      }}
      onCancel={onClose}
      onOk={onSubmit}
    >
      <div className="schedule-msg-modal-body">
        <DatePicker disabledDate={disabledDate} onChange={onSelectDate} />
        <TimePicker 
          format="HH:mm"
          value={selectedTime}
          showNow={false}
          disabledHours={disabledHours}
          disabledMinutes={disabledMinutes}
          onSelect={onSelectTime}
        />
      </div>
    </Modal>
  )
}

export default ScheduleMessageModal
