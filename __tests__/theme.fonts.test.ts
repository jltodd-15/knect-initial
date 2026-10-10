/**
 * Ticket 4.5, part B: one font family, Manrope, in weights 400-800.
 *
 * These tests read the source and the two native projects. They prove the wiring is in place:
 * no other family is named in the screens, and each platform has the five files and registers
 * them. Whether the phone then draws Manrope is only checkable on a device (DEVICE_TESTS.md, 4.5).
 */

import fs from 'fs';
import path from 'path';
import design from '../docs/design/tokens.json';

const ROOT = path.resolve(__dirname, '..');
const read = (file: string) => fs.readFileSync(path.join(ROOT, file), 'utf8');

// components/ChatEventWidget.tsx is dead code that every sweep has left alone (CLAUDE.md).
const SWEPT = [
  'App.tsx',
  ...fs.readdirSync(path.join(ROOT, 'theme')).map(name => `theme/${name}`),
  ...fs
    .readdirSync(path.join(ROOT, 'components'), {recursive: true})
    .map(name => `components/${name}`)
    .filter(name => /\.tsx?$/.test(name) && !name.endsWith('ChatEventWidget.tsx')),
];

const WEIGHTS = Object.keys(design.font.files);
const FILES = Object.values(design.font.files);

test('the design ships five weights, 400 to 800', () => {
  expect(WEIGHTS).toEqual(['400', '500', '600', '700', '800']);
});

test.each(SWEPT)('%s names no font family but Manrope', file => {
  const families = [...read(file).matchAll(/fontFamily:\s*'([^']+)'/g)].map(match => match[1]);
  expect(families.filter(family => family !== 'Manrope')).toEqual([]);
});

test.each(SWEPT)('%s asks for no weight Manrope lacks', file => {
  const weights = [...read(file).matchAll(/fontWeight:\s*'([^']+)'/g)].map(match => match[1]);
  const allowed = [...WEIGHTS, 'bold', 'normal'];
  expect(weights.filter(weight => !allowed.includes(weight))).toEqual([]);
});

describe('iOS', () => {
  test.each(FILES)('%s is in the app folder, the same file the design ships', file => {
    const shipped = fs.readFileSync(path.join(ROOT, 'docs/design/fonts', file));
    expect(fs.readFileSync(path.join(ROOT, 'ios/Knect/Fonts', file)).equals(shipped)).toBe(true);
  });

  test('Info.plist lists the five files under UIAppFonts', () => {
    const plist = read('ios/Knect/Info.plist');
    const block = plist.match(/<key>UIAppFonts<\/key>\s*<array>([\s\S]*?)<\/array>/);
    expect(block).not.toBeNull();
    const listed = [...block![1].matchAll(/<string>([^<]+)<\/string>/g)].map(match => match[1]);
    expect(listed.sort()).toEqual([...FILES].sort());
  });

  test.each(FILES)('%s is copied into the app by the Xcode project', file => {
    const project = read('ios/Knect.xcodeproj/project.pbxproj');
    expect(project).toContain(`${file} in Resources`);
  });
});

describe('Android', () => {
  // Android resource names are lowercase.
  const resource = (file: string) => file.toLowerCase().replace('.ttf', '');

  test.each(FILES)('%s is a font resource, the same file the design ships', file => {
    const shipped = fs.readFileSync(path.join(ROOT, 'docs/design/fonts', file));
    const copied = fs.readFileSync(path.join(ROOT, 'android/app/src/main/res/font', `${resource(file)}.ttf`));
    expect(copied.equals(shipped)).toBe(true);
  });

  test('the family file maps each weight to its font', () => {
    const family = read('android/app/src/main/res/font/manrope.xml');
    Object.entries(design.font.files).forEach(([weight, file]) => {
      expect(family).toMatch(
        new RegExp(`app:fontWeight="${weight}"[^>]*app:font="@font/${resource(file)}"`),
      );
    });
  });

  test('the app registers the family under the name the theme uses', () => {
    const application = read('android/app/src/main/java/com/knect/MainApplication.kt');
    expect(application).toContain('addCustomFont(this, "Manrope", R.font.manrope)');
  });
});
