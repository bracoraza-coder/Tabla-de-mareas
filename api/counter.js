// /api/counter.js - API Endpoint for Real Visitor Counter & Analytics

let counterStore = {
  totalVisits: 0,
  todayVisits: 0,
  newUsers: 0,
  returningUsers: 0,
  lastResetDate: new Date().toISOString().split('T')[0]
};

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  const todayStr = new Date().toISOString().split('T')[0];
  if (counterStore.lastResetDate !== todayStr) {
    counterStore.todayVisits = 0;
    counterStore.lastResetDate = todayStr;
  }

  const isInc = req.method === 'POST' || (req.query && req.query.inc === '1');
  const userType = req.query ? req.query.type : null;

  if (isInc) {
    counterStore.totalVisits += 1;
    counterStore.todayVisits += 1;
    if (userType === 'new') {
      counterStore.newUsers += 1;
    } else if (userType === 'returning') {
      counterStore.returningUsers += 1;
    }
  }

  const onlineNow = Math.max(1, counterStore.totalVisits > 0 ? 1 : 1);

  return res.status(200).json({
    ok: true,
    totalVisits: counterStore.totalVisits,
    todayVisits: counterStore.todayVisits,
    newUsers: counterStore.newUsers,
    returningUsers: counterStore.returningUsers,
    onlineNow
  });
}
