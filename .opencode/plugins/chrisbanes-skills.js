import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Plugin } from "@opencode/plugin";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const skillsDir = path.resolve(__dirname, "../../skills");
const guidanceMarker = "CHRISBANES_SKILLS_OPENCODE_GUIDANCE";
const guidance = `<${guidanceMarker}>
Chris Banes skills are available in OpenCode. Use OpenCode's native skill tool to load focused guidance. For broad Kotlin, Android, JVM, or Jetpack Compose tasks, start by loading the using-chrisbanes-skills skill.
</${guidanceMarker}>`;

const unquote = (value) => {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    return JSON.parse(trimmed);
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) {
    return trimmed.slice(1, -1).replaceAll("''", "'");
  }
  return trimmed;
};

export const parseSkill = (skillFile) => {
  const source = fs.readFileSync(skillFile, "utf8");
  const frontmatter = source.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!frontmatter) throw new Error(`Skill frontmatter not found: ${skillFile}`);

  const values = {};
  for (const line of frontmatter[1].split(/\r?\n/)) {
    const field = line.match(/^([a-z0-9-]+):\s*(.*)$/i);
    if (field) values[field[1]] = unquote(field[2]);
  }

  const id = path.basename(path.dirname(skillFile));
  if (values.name !== id) {
    throw new Error(`Skill name ${values.name ?? "<missing>"} does not match directory ${id}`);
  }
  if (!values.description) throw new Error(`Skill description not found: ${skillFile}`);

  return {
    id,
    name: values.name,
    description: values.description,
    autoinvoke: values["disable-model-invocation"] === "true" ? false : undefined,
    path: skillFile,
    content: source.slice(frontmatter[0].length).trim(),
  };
};

export const loadSkills = (directory = skillsDir) => {
  if (!fs.existsSync(directory)) throw new Error(`Skills directory not found: ${directory}`);

  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(directory, entry.name, "SKILL.md"))
    .filter((skillFile) => fs.existsSync(skillFile))
    .sort()
    .map(parseSkill);
};

export default Plugin.define({
  id: "chrisbanes-skills",
  async setup(ctx) {
    let skills;
    try {
      skills = loadSkills();
    } catch (error) {
      console.warn(`[chrisbanes-skills] ${error.message}`);
      return;
    }

    await ctx.skill.transform((editor) => {
      for (const skill of skills) {
        if (editor.get(skill.id)) {
          editor.update(skill.id, (current) => Object.assign(current, skill));
        } else {
          editor.add(skill);
        }
      }
    });

    if (ctx.options.injectGuidance === true) {
      await ctx.session.hook("context", (event) => {
        const alreadyInjected = event.system.some(
          (part) => part.type === "text" && part.text.includes(guidanceMarker),
        );
        if (!alreadyInjected) event.system.push({ type: "text", text: guidance });
      });
    }
  },
});
