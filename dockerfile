# Use an official Node.js runtime as a parent image
FROM node:16

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json files
COPY package*.json ./

# Install app dependencies
RUN npm install

# Copy the rest of your app's source code into the container
COPY . .

# Expose the port the app will run on
EXPOSE 3000

# Define the command to run your app (in your case it might be 'npm start' or 'node index.js')
CMD ["node", "app.js"]
