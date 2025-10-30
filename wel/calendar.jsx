import React, { useState } from 'react';
import { Calendar, Plus, X } from 'lucide-react';

export default function MonthlyCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState({});
  const [selectedDay, setSelectedDay] = useState(null);
  const [eventText, setEventText] = useState('');

  const months = [
    'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
    'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'
  ];

  const weekDays = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    return { daysInMonth, startingDayOfWeek };
  };

  const { daysInMonth, startingDayOfWeek } = getDaysInMonth(currentDate);

  const changeMonth = (increment) => {
    const newDate = new Date(currentDate);
    newDate.setMonth(newDate.getMonth() + increment);
    setCurrentDate(newDate);
    setSelectedDay(null);
  };

  const getDateKey = (day) => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    return `${year}-${month}-${day}`;
  };

  const addEvent = () => {
    if (selectedDay && eventText.trim()) {
      const dateKey = getDateKey(selectedDay);
      const currentEvents = events[dateKey] || [];
      setEvents({
        ...events,
        [dateKey]: [...currentEvents, eventText.trim()]
      });
      setEventText('');
    }
  };

  const deleteEvent = (day, index) => {
    const dateKey = getDateKey(day);
    const updatedEvents = [...(events[dateKey] || [])];
    updatedEvents.splice(index, 1);
    if (updatedEvents.length === 0) {
      const newEvents = { ...events };
      delete newEvents[dateKey];
      setEvents(newEvents);
    } else {
      setEvents({
        ...events,
        [dateKey]: updatedEvents
      });
    }
  };

  const renderCalendarDays = () => {
    const days = [];
    
    // Empty cells before first day
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(<div key={`empty-${i}`} className="bg-gray-50 min-h-24"></div>);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const dateKey = getDateKey(day);
      const dayEvents = events[dateKey] || [];
      const isSelected = selectedDay === day;
      const isToday = new Date().toDateString() === new Date(currentDate.getFullYear(), currentDate.getMonth(), day).toDateString();

      days.push(
        <div
          key={day}
          onClick={() => setSelectedDay(day)}
          className={`border border-gray-200 p-2 min-h-24 cursor-pointer transition-all hover:bg-blue-50 ${
            isSelected ? 'bg-blue-100 ring-2 ring-blue-500' : 'bg-white'
          } ${isToday ? 'ring-2 ring-green-400' : ''}`}
        >
          <div className={`text-sm font-bold mb-1 ${isToday ? 'text-green-600' : 'text-gray-700'}`}>
            {day}
          </div>
          <div className="space-y-1">
            {dayEvents.map((event, index) => (
              <div
                key={index}
                className="bg-purple-100 text-purple-800 text-xs p-1 rounded flex items-start justify-between gap-1 group"
              >
                <span className="flex-1 break-words">{event}</span>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteEvent(day, index);
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity text-purple-600 hover:text-purple-900"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        </div>
      );
    }

    return days;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4" dir="rtl">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
          <div className="flex items-center justify-between">
            <button
              onClick={() => changeMonth(1)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              الشهر التالي ←
            </button>
            
            <div className="flex items-center gap-3">
              <Calendar size={32} className="text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">
                {months[currentDate.getMonth()]} {currentDate.getFullYear()}
              </h1>
            </div>

            <button
              onClick={() => changeMonth(-1)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
            >
              → الشهر السابق
            </button>
          </div>
        </div>

        {/* Add Event Section */}
        {selectedDay && (
          <div className="bg-white rounded-lg shadow-lg p-6 mb-4">
            <h2 className="text-xl font-bold text-gray-800 mb-4">
              إضافة فعالية ليوم {selectedDay} {months[currentDate.getMonth()]}
            </h2>
            <div className="flex gap-2">
              <input
                type="text"
                value={eventText}
                onChange={(e) => setEventText(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addEvent()}
                placeholder="اكتب الفعالية هنا..."
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={addEvent}
                className="px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors flex items-center gap-2"
              >
                <Plus size={20} />
                إضافة
              </button>
            </div>
          </div>
        )}

        {/* Calendar Grid */}
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          {/* Week days header */}
          <div className="grid grid-cols-7 bg-blue-600 text-white">
            {weekDays.map((day) => (
              <div key={day} className="p-3 text-center font-bold border-l border-blue-500 last:border-l-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar days */}
          <div className="grid grid-cols-7">
            {renderCalendarDays()}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-white rounded-lg shadow-lg p-4 mt-4">
          <p className="text-gray-600 text-center">
            💡 انقر على أي يوم لإضافة فعالية • مرر فوق الفعالية لحذفها • اليوم الحالي محاط بإطار أخضر
          </p>
        </div>
      </div>
    </div>
  );
}
