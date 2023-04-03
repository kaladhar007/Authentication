const express = require("express");
const app = express();
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const bcrypt = require("bcrypt");
let db = null;
const path = require("path");
const dbPath = path.join(__dirname, "userData.db");
app.use(express.json());
const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () => {
      console.log("server is running at https://localhost:3000");
    });
  } catch (e) {
    console.log(`DBError:${e.message}`);
    process.exit(1);
  }
};
initializeDBAndServer();
//api 1
app.post(`/register/`, async (request, response) => {
  const { username, name, password, gender, location } = request.body;
  const hashedPassword = await bcrypt.hash(request.body.password, 10);
  const existsQuery = `select * from user where username='${username}';`;
  const dbUser = await db.get(existsQuery);
  if (dbUser === undefined) {
    if (password.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const registerQuery = `insert into user(username,name,password,gender,location)
                                            values('${username}','${name}','${hashedPassword}','${gender}','${location}');`;
      const dbResponse = await db.run(registerQuery);
      const newUserId = dbResponse.lastId;
      response.status(200);
      response.send(`User created successfully`);
    }
  } else {
    response.status(400);
    response.send(`User already exists`);
  }
});

//api 2
app.post(`/login/`, async (request, response) => {
  const { username, password } = request.body;
  const searchQuery = `select * from user where username='${username}';`;
  const dbUser = await db.get(searchQuery);
  if (dbUser === undefined) {
    response.status(400);
    response.send(`Invalid user`);
  } else {
    const isPasswordMatched = await bcrypt.compare(password, dbUser.password);
    if (isPasswordMatched === true) {
      response.status(200);
      response.send(`Login success!`);
    } else {
      response.status(400);
      response.send(`Invalid password`);
    }
  }
});
// api 3
app.put(`/change-password`, async (request, response) => {
  const { username, oldPassword, newPassword } = request.body;
  const hashedNewPassword = await bcrypt.hash(newPassword, 10);
  const searchQuery = `select * from user where username='${username}';`;
  const getOldDetailsOfUser = await db.get(searchQuery);
  console.log(getOldDetailsOfUser, "....................");
  const isOldPasswordIsCorrect = await bcrypt.compare(
    oldPassword,
    getOldDetailsOfUser.password
  );
  if (isOldPasswordIsCorrect === true) {
    if (newPassword.length < 5) {
      response.status(400);
      response.send("Password is too short");
    } else {
      const changeQuery = `update user set password='${hashedNewPassword}' where username='${username}';`;
      const dbUser = await db.run(changeQuery);
      response.status(200);
      response.send("Password updated");
    }
  } else {
    response.status(400);
    response.send("Invalid current password");
  }
});
module.exports = app;
