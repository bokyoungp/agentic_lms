import pathlib, subprocess, sys
src = pathlib.Path(__file__).parent / 'src'
tpl = (src/'template.html').read_text(encoding='utf-8')
css = (src/'style.css').read_text(encoding='utf-8')
app = (src/'app.js').read_text(encoding='utf-8')
bot = (src/'bot_part.js').read_text(encoding='utf-8') if (src/'bot_part.js').exists() else ''
assert '/*BOT*/' in app
app = app.replace('/*BOT*/', bot)
js = '\n'.join((src/f).read_text(encoding='utf-8') for f in ['content1.js','content2.js','content3.js'])
js += '\n' + app
js = js.replace('</script>', '<\\/script>')
out = tpl.replace('/*CSS*/', css).replace('/*JS*/', js)
p = pathlib.Path(__file__).parent / 'out' / 'index.html'
p.parent.mkdir(exist_ok=True)
p.write_text(out, encoding='utf-8')
print(p, len(out)//1024, 'KB')

(pathlib.Path(__file__).parent/'server').mkdir(exist_ok=True)
try:
  subprocess.run(['node', str(src/'export_kb.js'), str(pathlib.Path(__file__).parent/'server'/'kb.json')], check=True)
except FileNotFoundError:
  sys.exit('Node.js가 필요하다. node --version 으로 확인한다.')
