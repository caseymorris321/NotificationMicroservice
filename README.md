### Notifcation Microservice
Microservice that handles reminders and notifications for a to-do list application.

### How to use:
1. Make sure you have Node.js and MongoDB installed.
2. Clone the repository.
3. Run `npm install` to install dependencies.
4. Configure the MongoDB connection URL in the .env file.
5. Run `node notification-service.js` to start the server.
6. The microservice will be running at http://localhost:3000. This can be changed in the broker.
    - Request Data:
         - To create a reminder, send a POST request to http://localhost:3000/api/reminders with the following data:
         {
            "title": "Reminder title",
            "dueDate": "YYYY-MM-DD",
            "dueTime": "HH:mm"
          }
        - To get all reminders, send a GET request to http://localhost:3000/api/reminders.
        - To get a specific reminder, send a GET request to http://localhost:3000/api/reminders/id, where id is the id of the reminder to be retrieved.
        - To delete a reminder, send a DELETE request to http://localhost:3000/api/reminders/id, where id is the id of the reminder to be deleted.
    
    - Receive Data:
        - Created and fetched reminders are in JSON format.

### How it works:
The microservice uses the Molecular framework. It uses REST API for communication pipes. The microservice is responsible for creating, fetching, and deleting reminders. It also handles sending notifications to the user when a reminder is due. The microservice uses MongoDB to store reminders. It periodically checks for due reminders, and when a reminder is due, it sends a notification to the user within one hour (can be changed based on preference) of it being due (right now as a console log). A third-party service can easily be added to send reminders via email or SMS. I've added comments where preferences can be changed.

### UML Diagram
(UMLDiagram.png)

### Communication Contract
- To create a reminder, send a POST request to http://localhost:3000/api/reminders with the reminder details (title, dueDate, dueTime) in the request body as JSON.
- To retrieve the details of a specific reminder, send a GET request to http://localhost:3000/api/reminders/:reminderId, where :reminderId is the unique identifier of the reminder.
- To retrieve all reminders, send a GET request to http://localhost:3000/api/reminders.
- To delete a reminder, send a DELETE request to http://localhost:3000/api/reminders/:reminderId, where :reminderId is the unique identifier of the reminder.

The microservice will respond with the requested data in JSON format or with appropriate status codes and error messages if any issues occur.