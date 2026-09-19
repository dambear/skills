import assert from "node:assert/strict";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
import plugin, { loadSkills } from "./chrisbanes-skills.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsDir = path.resolve(__dirname, "../../skills");

test("loads every packaged skill with its content and path", () => {
  const skills = loadSkills(skillsDir);
  assert.equal(skills.length, 18);
  assert.equal(new Set(skills.map((skill) => skill.id)).size, skills.length);

  const animations = skills.find((skill) => skill.id === "compose-animations");
  assert.equal(animations.name, "compose-animations");
  assert.match(animations.description, /Jetpack Compose motion/);
  assert.match(animations.content, /^# Compose: animations/m);
  assert.equal(animations.path, path.join(skillsDir, "compose-animations", "SKILL.md"));
});

test("translates explicit-only frontmatter to V2 autoinvoke metadata", () => {
  const skills = loadSkills(skillsDir);
  assert.equal(skills.find((skill) => skill.id === "implement-with-subagents").autoinvoke, false);
  assert.equal(skills.find((skill) => skill.id === "shepherd").autoinvoke, false);
  assert.equal(skills.find((skill) => skill.id === "compose-state-and-effects").autoinvoke, undefined);
});

test("registers skills and overrides an earlier skill with the same id", async () => {
  const registered = new Map([
    ["compose-animations", { id: "compose-animations", content: "local" }],
  ]);
  let contextHookCalled = false;
  const ctx = {
    options: { injectGuidance: false },
    skill: {
      async transform(callback) {
        callback({
          get: (id) => registered.get(id),
          add: (skill) => registered.set(skill.id, { ...skill }),
          update: (id, update) => update(registered.get(id)),
        });
      },
    },
    session: {
      async hook() {
        contextHookCalled = true;
      },
    },
  };

  await plugin.setup(ctx);

  assert.equal(registered.size, 18);
  assert.match(registered.get("compose-animations").content, /^# Compose: animations/m);
  assert.equal(contextHookCalled, false);
});

test("injects routing guidance only when enabled and only once", async () => {
  let contextHook;
  const ctx = {
    options: { injectGuidance: true },
    skill: {
      async transform(callback) {
        const registered = new Map();
        callback({
          get: (id) => registered.get(id),
          add: (skill) => registered.set(skill.id, { ...skill }),
          update: (id, update) => update(registered.get(id)),
        });
      },
    },
    session: {
      async hook(name, callback) {
        assert.equal(name, "context");
        contextHook = callback;
      },
    },
  };

  await plugin.setup(ctx);
  const event = { system: [] };
  contextHook(event);
  contextHook(event);
  assert.equal(event.system.length, 1);
  assert.match(event.system[0].text, /CHRISBANES_SKILLS_OPENCODE_GUIDANCE/);
});
