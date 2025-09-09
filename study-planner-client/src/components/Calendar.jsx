import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { Button } from './ui/Button';
import { Calendar as CalendarIcon, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

const Calendar = ({ events, onDateSelect }) => {
  const [selectedView, setSelectedView] = useState('dayGridMonth');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarApi, setCalendarApi] = useState(null);
  const [animate, setAnimate] = useState(false);
  const calendarRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Add animation after initial render
    const timer = setTimeout(() => {
      setAnimate(true);
    }, 300);
    
    return () => clearTimeout(timer);
  }, []);
  
  // Debug the events being received
  useEffect(() => {
    if (events && events.length > 0) {
      console.log('Calendar received events:', JSON.stringify(events, null, 2));
    }
  }, [events]);

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    const eventId = event.id;
    
    // Check if the user wants to edit or start the session
    const startSession = window.confirm("Do you want to start this study session? Click OK to start, or Cancel to edit.");
    
    if (startSession) {
      // Navigate to the study session page with the session ID
      navigate(`/study-session?sessionId=${eventId}`);
    } else {
      // Navigate to edit session page with the event ID
      navigate(`/edit-session/${eventId}`, {
        state: { 
          session: {
            subject: event.title,
            startTime: event.start,
            endTime: event.end,
            description: event.extendedProps.description
          }
        }
      });
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
      const api = calendarRef.current.getApi();
      api.changeView(view);
      setCurrentDate(api.getDate());
    }
  };

  const handleNext = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.next();
      setCurrentDate(api.getDate());
    }
  };

  const handlePrev = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.prev();
      setCurrentDate(api.getDate());
    }
  };

  const handleToday = () => {
    if (calendarRef.current) {
      const api = calendarRef.current.getApi();
      api.today();
      setCurrentDate(api.getDate());
    }
  };

  // Format the current date based on the view
  const formatCurrentDate = () => {
    const options = {
      timeGridDay: { year: 'numeric', month: 'long', day: 'numeric' },
      timeGridWeek: { year: 'numeric', month: 'short' },
      dayGridMonth: { year: 'numeric', month: 'long' }
    };
    
    return new Intl.DateTimeFormat('en-US', options[selectedView] || options.dayGridMonth).format(currentDate);
  };
  
  // Custom rendering for events
  const renderEventContent = (eventInfo) => {
    const status = eventInfo.event.extendedProps.status;
    let eventClass = "";
    let icon = null;
    let tag = null;
    if (status === "completed") {
      eventClass = "calendar-event-completed";
      icon = <span className="mr-1">✅</span>;
    } else if (status === "missed") {
      eventClass = "calendar-event-missed";
      icon = <span className="mr-1">⚠️</span>;
      tag = <span className="calendar-event-missed-tag ml-2">Missed</span>;
    }
    return (
      <div className={`fc-event-main-content p-2 overflow-hidden cursor-pointer ${eventClass}`} style={{fontWeight: 'bold'}}>
        <div className="font-bold flex items-center">
          {icon}
          <span>{eventInfo.event.title}</span>
          {tag}
        </div>
        {selectedView !== 'dayGridMonth' && (
          <div className="text-xs flex items-center opacity-100">
            <Clock className="mr-1 h-3 w-3" />
            {eventInfo.timeText}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`transition-all duration-500 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="mb-3 bg-card shadow-md rounded-lg p-4">
        <div className="flex flex-wrap justify-between items-center mb-3">
          <div className="flex items-center">
            <CalendarIcon className="mr-2 h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold text-gradient">{formatCurrentDate()}</h2>
          </div>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrev}
              className="hover-lift"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleToday}
              className="hover-lift"
            >
              Today
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleNext}
              className="hover-lift"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="flex flex-wrap gap-2 mb-2">
          <Button 
            variant={selectedView === 'dayGridMonth' ? 'gradient' : 'outline'}
            size="sm"
          onClick={() => handleViewChange('dayGridMonth')}
            className="transition-all duration-300"
        >
          Month
          </Button>
          <Button 
            variant={selectedView === 'timeGridWeek' ? 'gradient' : 'outline'}
            size="sm"
          onClick={() => handleViewChange('timeGridWeek')}
            className="transition-all duration-300"
        >
          Week
          </Button>
          <Button 
            variant={selectedView === 'timeGridDay' ? 'gradient' : 'outline'}
            size="sm"
          onClick={() => handleViewChange('timeGridDay')}
            className="transition-all duration-300"
        >
          Day
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-lg shadow-lg overflow-hidden hover-lift border border-border">
        <div className="calendar-container p-4">
          <style>{`
            .fc-day-today {
              background-color: var(--accent-color) !important;
            }
            
            /* Basic event styling */
            .fc-event {
              border-radius: 6px;
              border: none !important;
              box-shadow: 0 2px 4px rgba(0,0,0,0.2);
              transition: transform 0.2s ease, box-shadow 0.2s ease;
              font-weight: 600 !important;
              opacity: 1 !important;
            }
            
            .fc-event:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(0,0,0,0.25);
              cursor: pointer;
            }
            
            /* Header styling */
            .fc-col-header-cell {
              background-color: var(--card-background);
              padding: 10px 0;
              font-weight: 600;
            }
            
            /* Grid styling */
            .fc .fc-scrollgrid {
              border-radius: 8px;
              border: 1px solid var(--border-color);
            }
            
            .fc .fc-scrollgrid-section > td {
              border: 1px solid var(--border-color);
            }
            
            .fc-theme-standard .fc-scrollgrid {
              border: 1px solid var(--border-color);
            }
            
            .fc-theme-standard td, .fc-theme-standard th {
              border: 1px solid var(--border-color);
            }
            
            .fc .fc-daygrid-day.fc-day-today {
              background-color: var(--accent-color);
              opacity: 0.2;
            }
            
            /* Remove now indicator */
            .fc .fc-timegrid-now-indicator-line {
              display: none !important;
            }
            
            .fc .fc-timegrid-now-indicator-arrow {
              display: none !important;
            }
            
            /* Month view event styling */
            .fc-daygrid-event {
              padding: 2px 4px;
            }
            
            .fc-daygrid-dot-event .fc-event-title {
              font-weight: bold !important;
            }
            
            /* Force vivid text colors */
            .fc-v-event .fc-event-title,
            .fc-h-event .fc-event-title,
            .fc-daygrid-event .fc-event-title {
              color: white !important;
              font-weight: 700 !important;
              text-shadow: 0px 1px 2px rgba(0,0,0,0.3);
              letter-spacing: 0.02em;
              margin: 2px 0;
            }
            
            .fc-event-time {
              color: white !important;
              font-weight: 600 !important;
              opacity: 1 !important;
            }
            
            /* Force visibility in all views */
            .fc-timegrid-event-harness, 
            .fc-daygrid-event-harness {
              visibility: visible !important;
              opacity: 1 !important;
            }
            
            /* Make content stand out */
            .fc-event-main-content {
              font-weight: 700 !important;
              padding: 3px 6px !important;
            }
            
            /* Fix for month view link */
            .fc-daygrid-more-link {
              color: var(--primary-color);
              font-weight: 600;
            }
            
            /* Add vivid borders */
            .fc-daygrid-event {
              border-left: 3px solid rgba(0,0,0,0.3) !important;
            }
            
            /* Fix week and day view event colors */
            .fc-timegrid-event-harness .fc-timegrid-event {
              box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3) !important;
              border-left: 4px solid rgba(0, 0, 0, 0.3) !important;
              opacity: 1 !important;
            }
            
            /* Ensure events display in all views */
            .fc-timeGridDay-view .fc-timegrid-slots,
            .fc-timeGridWeek-view .fc-timegrid-slots {
              z-index: 0 !important;
            }

            .fc-v-event, .fc-h-event {
              opacity: 1 !important;
              z-index: 10 !important;
            }

            .calendar-event-completed {
              background: rgba(34,197,94,0.08) !important;
              color: #22c55e !important;
              opacity: 1 !important;
            }
            .calendar-event-missed {
              background: #ef4444 !important;
              color: #ffffff !important;
              opacity: 1 !important;
            }
            .calendar-event-missed-tag {
              background: #ffffff;
              color: #ef4444;
              border-radius: 8px;
              font-size: 0.7em;
              padding: 0 6px;
              margin-left: 4px;
              font-weight: 600;
              opacity: 0.9;
            }
          `}</style>
          
          <FullCalendar
            ref={calendarRef}
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView={selectedView}
            headerToolbar={false}
            editable={true}
            selectable={true}
            selectMirror={true}
            dayMaxEvents={3}
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
            nowIndicator={false}
            forceEventDuration={true}
            eventDisplay="block"
            eventOrder="start"
            eventDidMount={(info) => {
              // Direct DOM styling for vivid colors
              if (info.event.backgroundColor) {
                // Make event background color vibrant
                const color = info.event.backgroundColor;
                
                // Apply vivid styling to the entire event element
                info.el.style.backgroundColor = color;
                info.el.style.borderColor = color;
                info.el.style.color = '#ffffff';
                info.el.style.fontWeight = '700';
                
                // Apply styles to inner elements
                const title = info.el.querySelector('.fc-event-title');
                const time = info.el.querySelector('.fc-event-time');
                
                if (title) {
                  title.style.fontWeight = '700';
                  title.style.color = '#ffffff';
                  title.style.textShadow = '0px 1px 2px rgba(0,0,0,0.3)';
                }
                
                if (time) {
                  time.style.fontWeight = '600';
                  time.style.color = '#ffffff';
                  time.style.opacity = '1';
                }
              }
            }}
            eventContent={renderEventContent}
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
    </div>
  );
};

export default Calendar; 