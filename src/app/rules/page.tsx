export default function RulesPage() {
  return (
    <main className="max-w-3xl mx-auto mt-8 p-6">
      <h1 className="text-3xl font-bold mb-8">Game Rules</h1>

      {/* Section 1: Scoring Rules */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Scoring Rules</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Player Stats Scoring</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li><strong>Goal:</strong> +5</li>
            <li><strong>Assist:</strong> +3</li>
            <li><strong>Own Goal:</strong> −2</li>
            <li><strong>Yellow Card:</strong> −1</li>
            <li><strong>Red Card:</strong> −3 (overrides yellow cards)</li>
          </ul>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Goalkeeper Rules</h3>
          <p className="text-gray-700 mb-2">
            GK points = <strong>7 − goals conceded</strong>
          </p>
          <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
            <li>0 conceded: +7</li>
            <li>1 conceded: +6</li>
            <li>2 conceded: +5</li>
            <li>3 conceded: +4</li>
            <li>4 conceded: +3</li>
            <li>… continues with no minimum</li>
          </ul>
          <p className="text-sm text-gray-600 mt-2">
            No clean sheet bonus separate from this formula.
          </p>
        </div>

        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">Outfield Defensive Bonus</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>If team concedes <strong>3 or fewer</strong> → <strong>+1 point</strong></li>
            <li>If team concedes <strong>4+</strong> → <strong>0 bonus</strong></li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Captain</h3>
          <p className="text-gray-700">
            Captain receives <strong>2× total fantasy points</strong> for the gameweek.
          </p>
        </div>
      </section>

      {/* Section 2: League Structure */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">League Structure</h2>
        
        <p className="text-gray-700 mb-4">
          Every user is automatically placed in <strong>three leagues</strong> on signup:
        </p>

        <ol className="list-decimal list-inside space-y-3 text-gray-700 mb-6">
          <li>
            <strong>Overall League</strong>
            <p className="text-sm text-gray-600 ml-6 mt-1">
              Contains <em>every player</em> in the game.
            </p>
          </li>
          <li>
            <strong>Shevet League</strong>
            <p className="text-sm text-gray-600 ml-6 mt-1">
              Based on the user&apos;s selected shevet:
            </p>
            <ul className="list-disc list-inside ml-6 mt-1 text-sm text-gray-600">
              <li>Ktan Tanim</li>
              <li>Gurim</li>
              <li>Roim</li>
              <li>Moledet</li>
              <li>Chaim</li>
              <li>Reim</li>
              <li>Kaveh</li>
            </ul>
          </li>
          <li>
            <strong>Maddie/Channie League</strong>
            <p className="text-sm text-gray-600 ml-6 mt-1">
              Based on the user&apos;s role selected at signup.
            </p>
          </li>
        </ol>

        <div>
          <h3 className="text-lg font-semibold mb-2">Standings Calculation</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>Total points = Sum of all <strong>finished</strong> gameweeks in <code className="bg-gray-100 px-1 rounded">GameweekScore</code>.</li>
            <li>Latest GW points shown from the most recently finished gameweek.</li>
          </ul>
        </div>
      </section>

      {/* Section 3: Transfer Rules */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Transfer Rules</h2>
        
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-6">
          <li>Each gameweek has a <strong>deadline</strong> (set by Admin).</li>
          <li>Transfers are allowed <strong>only before the deadline</strong>.</li>
          <li>Transfers are blocked when:
            <ul className="list-disc list-inside ml-6 mt-1">
              <li>The deadline has passed</li>
              <li>The gameweek is marked as <strong>finished</strong></li>
              <li>Admin globally closes transfers</li>
            </ul>
          </li>
        </ul>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Budget</h3>
          <p className="text-gray-700">
            Every team starts with <strong>R34.0</strong>.
          </p>
          <p className="text-gray-700 mt-1">
            You must always remain within budget.
          </p>
        </div>

        <div className="mb-4">
          <h3 className="text-lg font-semibold mb-2">Squad Requirements</h3>
          <ul className="list-disc list-inside space-y-1 text-gray-700">
            <li>1 <strong>Goalkeeper</strong> (GK1)</li>
            <li>4 <strong>Outfield players</strong> (OUT1–OUT4)</li>
          </ul>
        </div>

        <div>
          <h3 className="text-lg font-semibold mb-2">Club Limit</h3>
          <p className="text-gray-700">
            Maximum <strong>3 players</strong> from the same team.
          </p>
        </div>
      </section>

      {/* Section 4: Pick Team Rules */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Pick Team Rules</h2>
        
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Pick Team is available only before the deadline.</li>
          <li>You may choose <strong>one</strong> captain each gameweek.</li>
          <li>Captain can be changed freely until the deadline.</li>
          <li>Captain cannot be changed after lock.</li>
        </ul>
      </section>

      {/* Section 5: Captain Rules */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Captain Rules</h2>
        
        <ul className="list-disc list-inside space-y-2 text-gray-700">
          <li>Only one captain at a time.</li>
          <li>Captain points are doubled AFTER all stat rules.</li>
          <li>If no captain is selected:
            <ul className="list-disc list-inside ml-6 mt-1">
              <li>No doubling is applied.</li>
            </ul>
          </li>
        </ul>
      </section>

      {/* Section 6: Gameweek Deadlines & Locks */}
      <section className="mb-10">
        <h2 className="text-xl font-bold mb-4">Gameweek Deadlines & Locks</h2>
        
        <p className="text-gray-700 mb-4">
          The following actions are <em>locked</em> when the gameweek deadline passes:
        </p>
        
        <ul className="list-disc list-inside space-y-2 text-gray-700 mb-4">
          <li>Transfers</li>
          <li>Captain changes</li>
          <li>Pick Team changes</li>
        </ul>

        <p className="text-gray-700 mb-2">
          Lock triggers when either:
        </p>
        <ul className="list-disc list-inside space-y-1 text-gray-700 ml-4">
          <li><code className="bg-gray-100 px-1 rounded">deadlineAt</code> &lt; now</li>
          <li>OR <code className="bg-gray-100 px-1 rounded">isFinished == true</code></li>
          <li>OR global setting <code className="bg-gray-100 px-1 rounded">transfersOpen == false</code></li>
        </ul>

        <p className="text-gray-600 text-sm mt-4">
          This ensures fairness across players.
        </p>
      </section>
    </main>
  );
}
