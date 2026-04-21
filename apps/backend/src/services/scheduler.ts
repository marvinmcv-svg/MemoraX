import cron from 'node-cron';

export function startScheduler() {
  console.log('Starting MemoraX Scheduler...');

  cron.schedule('* * * * *', async () => {
    console.log('Reminder check...');
  });

  cron.schedule('0 7 * * *', async () => {
    console.log('Daily briefing generation...');
  });

  console.log('Scheduler started');
}
