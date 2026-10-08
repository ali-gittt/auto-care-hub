# Auto Care Hub

Build a modern, responsive car repair workshop management website with 3 roles:

• Customer: Create appointments with First Name, Last Name, Vehicle Make, Vehicle Model, Vehicle Year, License Plate, and Problem Description. Customers can only see their own appointments, vehicle status, and repair costs.
• Worker: View incoming appointments, accept or reject them. When accepting, select a specific date and time. Manage repairs and update status: Confirmed → In Repair → Completed and payment status.
• Manager/Admin: Has all Worker permissions plus full access to customers, vehicles, appointments, repairs, workers, prices, and workshop statistics.

Create separate dashboards and navigation for each role. The Admin dashboard should include statistics for appointments, repairs, completed/active repairs, rejected appointments, revenue, average repair cost, average repair duration, common problems, and worker performance, with filters for Today, This Week, This Month, This Year, and Custom Range.

Make the UI clean, professional, and responsive. Keep the code modular and easy to extend.

Do not implement any AI features yet. AI Diagnosis and AI Cost Prediction will be added later through Antigravity.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/ef28a116-80fe-4fe8-93a3-b23fd197c449).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
