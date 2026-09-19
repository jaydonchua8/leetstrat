import { useState } from 'react';
import { getDemoUserId, setDemoUserId } from './demoUser';

export function DemoUserField() {
  const [value, setValue] = useState(getDemoUserId);
  return (
    <label className="inline-field demo-user" title="Printed by `npm run db:seed`">
      Demo user
      <input
        type="text"
        value={value}
        placeholder="paste userId from seed"
        spellCheck={false}
        onChange={(e) => {
          setValue(e.target.value);
          setDemoUserId(e.target.value);
        }}
      />
    </label>
  );
}
