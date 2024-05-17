const { ServiceBroker } = require("moleculer");
const ApiService = require("moleculer-web");
const DbService = require("moleculer-db");
const MongoDBAdapter = require("moleculer-db-adapter-mongo");
const { v4: uuidv4 } = require("uuid");

require("dotenv").config();

// change to your preference
const broker = new ServiceBroker({
    nodeID: "notification-service",
    transporter: "TCP",
    port: 3000,
    host: "localhost"
});

broker.createService({
    name: "notification",
    mixins: [ApiService, DbService],
    adapter: new MongoDBAdapter(process.env.MONGODB_URI),
    collection: "reminders",

    settings: {
        routes: [{
            path: "/api",
            aliases: {
                "POST /reminders": "notification.createReminder",
                "GET /reminders/:reminderId": "notification.getReminderDetails",
                "GET /reminders": "notification.getAllReminders",
                "DELETE /reminders/:reminderId": "notification.deleteReminder",
            }
        }]
    },

    actions: {
        createReminder: {
            params: {
                title: "string",
                dueDate: "string",
                dueTime: "string",
            },
            handler(ctx) {
                const { title, dueDate, dueTime } = ctx.params;

                if (!title || !dueDate || !dueTime) {
                    const error = new Error("Missing required fields (400)");
                    error.code = 400;
                    throw error;
                }

                const parsedDueDate = new Date(`${dueDate}T${dueTime}`);
                const reminderId = uuidv4();

                return this.adapter.findOne({ title })
                    .then(existingReminder => {
                        if (existingReminder) {
                            const error = new Error("Reminder with the same title already exists (409)");
                            error.code = 409;
                            throw error;
                        }

                        return this.adapter.insert({ reminderId, title, dueDate: parsedDueDate, notificationSent: false });
                    })
                    .then(reminder => {
                        ctx.meta.$statusCode = 201;
                        ctx.meta.$location = `/api/reminders/${reminder.reminderId}`;
                        return reminder;
                    })
                    .catch(err => {
                        ctx.meta.$statusCode = err.code || 500;
                        throw err;
                    });
            }
        },

        getReminderDetails: {
            params: {
                reminderId: "string",
            },
            handler(ctx) {
                const { reminderId } = ctx.params;
                return this.adapter.findOne({ reminderId })
                    .then(reminder => {
                        if (!reminder) {
                            const error = new Error("Reminder not found (404)");
                            error.code = 404;
                            throw error;
                        }
                        return reminder;
                    })
                    .catch(err => {
                        ctx.meta.$statusCode = err.code || 500;
                        throw err;
                    });
            }
        },

        getRemindersForTodoItem: {
            params: {
                todoItemId: "string",
            },
            handler(ctx) {
                const { todoItemId } = ctx.params;
                return this.adapter.find({ query: { todoItemId } })
                    .catch(err => {
                        ctx.meta.$statusCode = 500;
                        throw err;
                    });
            }
        },

        getAllReminders: {
            handler(ctx) {
                return this.adapter.find()
                    .catch(err => {
                        ctx.meta.$statusCode = 500;
                        throw err;
                    });
            }
        },

        deleteReminder: {
            params: {
                reminderId: "string",
            },
            handler(ctx) {
                const { reminderId } = ctx.params;
                return this.adapter.removeById(reminderId)
                    .then(reminder => {
                        if (!reminder) {
                            const error = new Error("Reminder not found (404)");
                            error.code = 404;
                            throw error;
                        }
                        return { message: "Reminder deleted successfully" };
                    })
                    .catch(err => {
                        ctx.meta.$statusCode = err.code || 500;
                        throw err;
                    });
            }
        },
    },

    events: {
        "reminder.check"() {
            const now = new Date();
            // change to preferred time to be reminded
            const oneHour = new Date(now.getTime() + 60 * 60 * 1000);

            this.adapter.find({
                query: {
                    dueDate: {
                        $gte: now,
                        $lte: oneHour
                    },
                    notificationSent: false
                }
            })
                .then(reminders => {
                    reminders.forEach(reminder => {
                        sendNotification(reminder);
                        this.adapter.updateById(reminder._id, { $set: { notificationSent: true } })
                            .then(updatedReminder => {
                                if (updatedReminder) {
                                    reminder.notificationSent = true;
                                } else {
                                    console.error("Failed to update reminder notification status for reminderId:", reminder.reminderId);
                                }
                            })
                            .catch(err => {
                                console.error("Error updating reminder notification status:", err);
                            });
                    });
                })
                .catch(err => {
                    console.error("Error checking reminders:", err);
                });
        }
    },

    created() {
        setInterval(() => {
            this.broker.emit("reminder.check");
        }, 60 * 1000);
    }
});

function sendNotification(reminder) {
    // you can add email or SMS service here instead of console.log
    const dueDate = reminder.dueDate;
    const formattedDate = dueDate.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        hour12: true
    });
    console.log(`Reminder: ${reminder.title} (Due: ${formattedDate})`);
}

broker.start();
