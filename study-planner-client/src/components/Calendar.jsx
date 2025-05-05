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

  const handleEventClick = (clickInfo) => {
    const event = clickInfo.event;
    const eventId = event.id;
    
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
    return (
      <div className="fc-event-main-content p-1 overflow-hidden cursor-pointer">
        <div className="font-medium">{eventInfo.event.title}</div>
        {selectedView !== 'dayGridMonth' && (
          <div className="text-xs flex items-center opacity-90">
            <Clock className="mr-1 h-3 w-3" />
            {eventInfo.timeText}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`transition-all duration-500 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
      <div className="mb-6 bg-card shadow-md rounded-lg p-4">
        <div className="flex flex-wrap justify-between items-center mb-4">
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
        
        <div className="flex flex-wrap gap-2 mb-4">
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
            .fc-event {
              border-radius: 6px;
              border: none !important;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
              transition: transform 0.2s ease, box-shadow 0.2s ease;
            }
            .fc-event:hover {
              transform: translateY(-2px);
              box-shadow: 0 4px 8px rgba(0,0,0,0.15);
              cursor: pointer;
            }
            .fc-col-header-cell {
              background-color: var(--card-background);
              padding: 10px 0;
              font-weight: 600;
            }
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
            .fc .fc-timegrid-now-indicator-line {
              border-color: var(--primary-color);
              border-width: 2px;
            }
            .fc .fc-timegrid-now-indicator-arrow {
              border-color: var(--primary-color);
              border-width: 2px;
            }
            .fc-direction-ltr .fc-daygrid-event.fc-event-end, .fc-direction-rtl .fc-daygrid-event.fc-event-start {
              padding: 2px 4px;
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