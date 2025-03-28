import { useState, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';

const Calendar = ({ events, onEventClick, onDateSelect }) => {
  const [selectedView, setSelectedView] = useState('dayGridMonth');
  const calendarRef = useRef(null);

  const handleEventClick = (clickInfo) => {
    if (onEventClick) {
      onEventClick(clickInfo.event);
    }
  };

  const handleDateSelect = (selectInfo) => {
    if (onDateSelect) {
      onDateSelect(selectInfo);
    }
  };

  const handleViewChange = (view) => {
    setSelectedView(view);
    if (calendarRef.current) {
      calendarRef.current.getApi().changeView(view);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
        <button 
          onClick={() => handleViewChange('dayGridMonth')}
          style={{
            padding: '8px 16px',
            backgroundColor: selectedView === 'dayGridMonth' ? '#4a90e2' : '#f0f0f0',
            color: selectedView === 'dayGridMonth' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Month
        </button>
        <button 
          onClick={() => handleViewChange('timeGridWeek')}
          style={{
            padding: '8px 16px',
            backgroundColor: selectedView === 'timeGridWeek' ? '#4a90e2' : '#f0f0f0',
            color: selectedView === 'timeGridWeek' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Week
        </button>
        <button 
          onClick={() => handleViewChange('timeGridDay')}
          style={{
            padding: '8px 16px',
            backgroundColor: selectedView === 'timeGridDay' ? '#4a90e2' : '#f0f0f0',
            color: selectedView === 'timeGridDay' ? 'white' : 'black',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer'
          }}
        >
          Day
        </button>
      </div>

      <div style={{ 
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        padding: '20px'
      }}>
        <FullCalendar
          ref={calendarRef}
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView={selectedView}
          headerToolbar={false}
          editable={true}
          selectable={true}
          selectMirror={true}
          dayMaxEvents={true}
          weekends={true}
          events={events}
          eventClick={handleEventClick}
          select={handleDateSelect}
          height="auto"
          slotMinTime="06:00:00"
          slotMaxTime="22:00:00"
          allDaySlot={false}
          expandRows={true}
          stickyHeaderDates={true}
          nowIndicator={true}
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
          slotLabelFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
        />
      </div>
    </div>
  );
};

export default Calendar; 