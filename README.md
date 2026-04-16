# Bounty Jury System

A dedicated judging platform designed for the evaluation and scoring of bounty submissions. This system provides a professional, web-based portal with role-based access for judges and administrators, allowing for collaborative and secure assessment of submitted works based on a predefined scoring rubric.

## ✨ Features

- **Role-Based Access Control (RBAC)**:
  - **Judges**: Can evaluate submissions according to a 4-point criteria rubric.
  - **Admins**: Have extended capabilities and oversight on the evaluation process.
- **Secure Authentication**: Uses bcrypt for secure password hashing and enforces mandatory first-login password changes for enhanced security.
- **Dynamic Evaluation Panel**: Interactive UI sliders with tooltips for precise scoring based on:
  - Adherence to Prompts
  - Creativity
  - Quality
  - Presentation & Effort
- **Real-time Leaderboard**: Automatically calculates average scores across all judges and highlights top submissions.
- **Modern Tech Stack**: Fast and responsive frontend built with Next.js and React.

## 🚀 Getting Started

### Prerequisites

You need [Node.js](https://nodejs.org/) installed along with a MongoDB database (e.g., MongoDB Atlas).

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DatB0oi/bounty-jury-system.git
   cd bounty-jury-system
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Environment Variables:**
   Create a `.env.local` file in the root directory and configure your MongoDB connection string:
   ```env
   MONGODB_URI="mongodb+srv://<user>:<password>@cluster.mongodb.net/bounty?retryWrites=true&w=majority"
   ```
   *Note: Never commit your `.env.local` file to version control.*

### Seeding Initial Data

To initialize the database with default judges, roles, and settings, run the seed script:

```bash
node seedMongo.js
```
*Note: The default credentials for judges are defined in this script. Upon their first log-in, they will be forced to set their own custom password.*

### Running the server

Start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to use the application.

## 🛠 Tech Stack

- **Framework**: [Next.js](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: CSS Modules & Vanilla CSS properties
- **Database**: MongoDB (via Mongoose ORM)
- **Security**: bcryptjs

## 📝 Usage Guide

1. **Login**: Judges and admins access the portal with their default credentials.
2. **First Login**: On the initial sign-in, users are prompted and forced to set a secure, private password.
3. **Evaluation Phase**: Select a participant/submission from the main dashboard and use the rating sliders to evaluate it across the 4 key metrics.
4. **Scoring & Results**: The platform records the evaluation and calculates average scores automatically, adjusting the global leaderboard in real-time.
