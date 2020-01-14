const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const Task = require('../src/models/task');
const User = require('../src/models/user');

const { userOne, userTwo, setupDatabase, taskOne } = require('./fixtures/db');

// Before running each tests
beforeEach(setupDatabase);

test('shoud create new task for user', async () => {
  const response = await request(app)
    .post('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      description: 'User one first task'
    })
    .expect(201);

  const task = await Task.findById(response.body._id);
  // Assert Task is not null
  expect(task).not.toBeNull();
  // Assert Task has completed set to false by default
  expect(task.completed).toEqual(false);
});

// Request Tasks for user one
test('should fetch user tasks', async () => {
  const response = await request(app)
    .get('/tasks')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);

  // Assert length of tasks array is equals to 2
  expect(response.body.length).toEqual(2);
});

test('should not delete other users tasks', async () => {
  await request(app)
    .delete(`/tasks/${taskOne._id}`)
    .set('Authorization', `Bearer ${userTwo.tokens[0].token}`)
    .send()
    .expect(404);

  const task = await Task.findById(taskOne._id);
  expect(task).not.toBeNull();
});

afterAll(async done => {
  await mongoose.connection.close();
  done();
});
