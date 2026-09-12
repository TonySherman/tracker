/* Streak — bootstrap (title screen stage) */
const splash = document.getElementById('splash');
const app = document.getElementById('app');

app.innerHTML = `
  <div class="wrap view">
    <header class="hdr"><div class="hdr-row"><div><h1>Streak</h1><p class="sub">Small things. Every day.</p></div></div></header>
    <div class="empty card">
      <div class="emoji">🌱</div>
      <h3>Coming to life</h3>
      <p>The habit tracker is being built. Check back in a moment — tracking, streaks and stats are on the way.</p>
    </div>
  </div>`;

setTimeout(() => {
  splash.classList.add('hide');
  app.hidden = false;
}, 1100);
