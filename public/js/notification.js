
// Assuming service workers and push notifications are set up

function showNotification(title, body) {
    if (Notification.permission === "granted") {
      navigator.serviceWorker.ready.then(function(registration) {
        registration.showNotification(title, {
          body: body,
          icon: '/images/notification-icon.png',
          tag: 'lecture-reminder'
        });
      });
    }
  }
  
  function pushLectureNotification(lecture) {
    const title = "Upcoming Lecture Reminder!";
    const body = `${lecture.courseTitle} by ${lecture.instructorName} at ${lecture.venue} starting ${lecture.time}.`;
    showNotification(title, body);
  }
  
  // You'd call pushLectureNotification whenever new lecture data is available.
  
// Call this function when a new lecture is available (example usage)
// notifyUser('Introduction to Programming', 'Room 204', '10:00 AM', 'Dr. John', 'CSE101');
