import React, { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import "./CalendarSelector.css";

function CalendarSelector() {
  const [selectedDate, setSelectedDate] = useState(null);
  const [showCalendar, setShowCalendar] = useState(false);
  const [anyDate, setAnyDate] = useState(true);
  const [anyTime, setAnyTime] = useState(true);

  const today = new Date();
  const tomorrow = new Date();
  tomorrow.setDate(today.getDate() + 1);

  const handleDateSelect = (date) => {
    setSelectedDate(date);
    setAnyDate(false);
    setShowCalendar(false);
  };

  const handleSearch = () => {
    if (anyDate) {
      alert("Căutare pentru: Orice zi, " + (anyTime ? "orice oră" : selectedDate.toLocaleTimeString()));
    } else {
      alert("Căutare pentru: " + selectedDate.toLocaleString());
    }
  };

  return (
    <div className="calendar-popup">
      <h4>Alege o dată</h4>
      <div className="button-group">
    
        <button onClick={() => { setSelectedDate(today); setAnyDate(false); }}>Azi</button>
        <button onClick={() => { setSelectedDate(tomorrow); setAnyDate(false); }}>Mâine</button>
        <button onClick={() => setShowCalendar(!showCalendar)}>Alege o dată</button>
      </div>

      {showCalendar && (
        <DatePicker
          selected={selectedDate}
          onChange={handleDateSelect}
          inline
          minDate={today}
        />
      )}

      <h4>Alege timp</h4>
      <div className="button-group">
        
        <DatePicker
          selected={selectedDate}
          onChange={(date) => {
            setSelectedDate(date);
            setAnyTime(false);
          }}
          showTimeSelect
          showTimeSelectOnly
          timeIntervals={30}
          timeCaption="Ora"
          dateFormat="HH:mm"
          placeholderText="Alege ora"
          disabled={false}
        />
      </div>

      <button className="search-btn" onClick={handleSearch}>Caută</button>
    </div>
  );
}

export default CalendarSelector;
