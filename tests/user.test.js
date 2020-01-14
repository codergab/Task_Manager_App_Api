const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/models/user');

const { userOne, userOneId, setupDatabase } = require('./fixtures/db');

// Before running each tests
beforeEach(setupDatabase);

test('should signup a new user', async () => {
  const response = await request(app)
    .post('/users')
    .send({
      name: 'Gabriel',
      email: 'gabriel@example.com',
      password: 'MyPass777!'
    })
    .expect(201);

  // Assert the database was changed successfully
  const user = await User.findById(response.body.user._id);
  expect(user).not.toBeNull();

  // Assertions about the response
  expect(response.body).toMatchObject({
    user: {
      name: 'Gabriel',
      email: 'gabriel@example.com'
    },
    token: user.tokens[0].token
  });
  // Assert the password is correct
  expect(user.password).not.toBe('myPass!8888');
});

test('shoulf login existing user', async () => {
  const { email, password } = userOne;
  const response = await request(app)
    .post('/users/login')
    .send({
      email,
      password
    })
    .expect(200);

  const user = await User.findById(response.body.user._id);
  // Assert the token matches
  expect(response.body.token).toBe(user.tokens[1].token);
});

test('should login fail using bad credentials', async () => {
  await request(app)
    .post('/users/login')
    .send({
      email: 'wrong-email@test.com',
      password: 'WrongMail!!!'
    })
    .expect(400);
});

test('should get profile for user', async () => {
  await request(app)
    .get('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
});

test('should not get profile for unauthenticated user', async () => {
  await request(app)
    .get('/users/me')
    .send()
    .expect(401);
});

test('shoud delete account for user', async () => {
  await request(app)
    .delete('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send()
    .expect(200);
  // Assert the user is removed
  const user = await User.findById(userOneId);
  expect(user).toBeNull();
});

test('should not delete account for unauthenticated user', async () => {
  await request(app)
    .delete('/users/me')
    .send()
    .expect(401);
});

test('should upload an avatar', async () => {
  await request(app)
    .post('/users/me/avatar')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .attach('avatar', 'tests/fixtures/profile-pic.jpg')
    .expect(200);
  // Assert the image has been uploaded
  const user = await User.findById(userOneId);
  expect(user.avatar).toEqual(expect.any(Buffer));
});

test('should update valid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      name: 'Ayo'
    })
    .expect(200);
  // assert the name has indeed changed
  const user = await User.findById(userOneId);
  expect(user.name).toEqual('Ayo');
});

test('should not update invalid user fields', async () => {
  await request(app)
    .patch('/users/me')
    .set('Authorization', `Bearer ${userOne.tokens[0].token}`)
    .send({
      location: 'Ibadan'
    })
    .expect(400);
});

afterAll(async done => {
  await mongoose.connection.close();
  done();
});
