const axios = require("axios");

async function testMicroservice() {
    try {
        // Create a reminder
        const createResponse = await axios.post("http://localhost:3000/api/reminders", {
            todoItemId: "abc123",
            title: "Submit project report7",
            dueDate: "2024-05-17",
            dueTime: "15:30"
        });
        const createdReminder = createResponse.data;
        console.log("Reminder created:", createdReminder);

        // Get reminder details
        const reminderResponse = await axios.get(`http://localhost:3000/api/reminders/${createdReminder.reminderId}`);
        const reminderDetails = reminderResponse.data;
        console.log("Reminder details:", reminderDetails);

        // Get all reminders
        const getAllResponse = await axios.get("http://localhost:3000/api/reminders");
        const allReminders = getAllResponse.data;
        console.log("All reminders:", allReminders);
    } catch (error) {
        if (error.response) {
            console.error("Error:", error.response.data.message);
        } else {
            console.error("Error:", error.message);
        }
    }
}


testMicroservice();
