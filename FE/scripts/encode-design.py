"""Package code-derived design data within the Figma connector's code limit."""
from pathlib import Path
import base64, json, struct, sys

def normalize(value):
    if isinstance(value, float):
        return round(value, 1)
    if isinstance(value, dict):
        return {k:normalize(v) for k,v in value.items()
                if not (k == 'opacity' and v == 1)
                and not (k in ['radius', 'borderWidth'] and v == 0)
                and not (k == 'bg' and v == 'rgba(0, 0, 0, 0)')
                and not (k == 'border' and value.get('borderWidth', 0) == 0)}
    if isinstance(value, list):
        return [normalize(v) for v in value]
    return value

def encode(value):
    value = normalize(value)
    data = json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode('utf8')
    dictionary = {bytes([i]): i for i in range(256)}
    current, codes, next_code = b'', [], 256
    for byte in data:
        candidate = current + bytes([byte])
        if candidate in dictionary:
            current = candidate
        else:
            codes.append(dictionary[current])
            dictionary[candidate] = next_code
            next_code += 1
            current = bytes([byte])
            if next_code == 65535:
                codes.append(65535)
                dictionary = {bytes([i]): i for i in range(256)}
                next_code = 256
    if current:
        codes.append(dictionary[current])
    width = max(codes).bit_length()
    packed, buffer, buffered = bytearray(), 0, 0
    for code in codes:
        buffer |= code << buffered
        buffered += width
        while buffered >= 8:
            packed.append(buffer & 255)
            buffer >>= 8
            buffered -= 8
    if buffered:
        packed.append(buffer & 255)
    return {'b': width, 'n': len(codes), 'd': base64.b64encode(packed).decode()}

decoder = r"""
function unpack(p){const bytes=figma.base64Decode(p.d),codes=[];let buffer=0,buffered=0,index=0;for(let i=0;i<p.n;i++){while(buffered<p.b){buffer|=bytes[index++]<<buffered;buffered+=8;}codes.push(buffer&((1<<p.b)-1));buffer>>>=p.b;buffered-=p.b;}let dict=Array.from({length:256},(_,i)=>String.fromCharCode(i)),w='',out='';for(const k of codes){if(k===65535){dict=Array.from({length:256},(_,i)=>String.fromCharCode(i));w='';continue;}const entry=k<dict.length?dict[k]:w+w[0];out+=entry;if(w)dict.push(w+entry[0]);w=entry;}return JSON.parse(decodeURIComponent(Array.from(out,c=>'%'+c.charCodeAt(0).toString(16).padStart(2,'0')).join('')));}
"""
state = json.loads(Path('artifacts/design-state.json').read_text())
state = {key:state[key] for key in ['pages','collectionId','modeId','components','frames','images']}
state['frames'] = [{key:f[key] for key in ['id','route','width','role','order'] if key in f} for f in state['frames']]
screens = [json.loads(Path('artifacts/design', f'{int(i):02d}.json').read_text()) for i in sys.argv[1:]]
code = decoder + '\nconst STATE=unpack(' + json.dumps(encode(state)) + ');\nconst SCREENS=unpack(' + json.dumps(encode(screens)) + ');\nconst TARGET=' + json.dumps(screens[0]['role']) + ';\n' + Path('scripts/figma-importer.js').read_text()
Path('artifacts/design/import.js').write_text(code)
print(json.dumps({'chars':len(code),'screens':[s['name'] for s in screens]}))
if len(code)>49500:
    raise SystemExit('Split this batch: connector code limit is 50000 characters.')
