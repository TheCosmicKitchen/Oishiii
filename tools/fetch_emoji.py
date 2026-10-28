import json, sys, os, io, base64, urllib.request, urllib.parse
from PIL import Image

NAMES = {
 "ant":"Ant","dog":"Dog","cow":"Cow","shrimp":"Shrimp","riceball":"Rice ball","crab":"Crab","mushroom":"Mushroom",
 "bear":"Bear","bug":"Bug","ice":"Ice","fish":"Fish","deer":"Deer","sushi":"Sushi","ricecracker":"Rice cracker",
 "sled":"Sled","octopus":"Octopus","map":"World map","moon":"Crescent moon","envelope":"Envelope","bird":"Bird",
 "eggplant":"Eggplant","carrot":"Carrot","teddy":"Teddy bear","cat":"Cat","saw":"Carpentry saw","sakura":"Cherry blossom",
 "chick":"Baby chick","sailboat":"Sailboat","snake":"Snake","star":"Star","beans":"Beans","tangerine":"Tangerine",
 "ladybug":"Lady beetle","glasses":"Glasses","peach":"Peach","mountain":"Snow-capped mountain","ring":"Ring",
 "night":"Night with stars","camel":"Two-hump camel","apple":"Red apple","car":"Automobile","lemon":"Lemon","candle":"Candle",
 "croc":"Crocodile","link":"Link","books":"Books",
 "up":"Up arrow","house":"House","bluecircle":"Blue circle","heart":"Red heart","tree":"Deciduous tree","child":"Child",
 "shell":"Spiral shell","redcircle":"Red circle","speaking":"Speaking head","smile":"Smiling face with smiling eyes",
 "maple":"Maple leaf","station":"Station","rock":"Rock","foot":"Foot","umbrella":"Umbrella","herb":"Herb","sake":"Sake",
 "salt":"Salt","hand":"Raised hand","rice":"Sheaf of rice","down":"Down arrow","bamboo":"Tanabata tree","thread":"Yarn",
 "mouth":"Mouth","beach":"Beach with umbrella","target":"Bullseye","boy":"Boy","girl":"Girl","meat":"Meat on bone",
 "fire":"Fire","sun":"Sun","person":"Person","blossom":"Blossom","nose":"Nose","ship":"Ship","package":"Package",
 "bridge":"Bridge at night","eye":"Eye","ear":"Ear","houses":"Houses","horse":"Horse face","rain":"Cloud with rain",
 "store":"Convenience store","paper":"Page facing up","road":"Motorway","snowflake":"Snowflake","snowman":"Snowman without snow",
 "onsen":"Hot springs","bed":"Bed","sky":"Sun behind cloud","tulip":"Tulip","blackcircle":"Black circle","whitecircle":"White circle",
 "monkey":"Monkey","evergreen":"Evergreen tree","palette":"Artist palette","river":"National park","garden":"House with garden",
 "yen":"Yen banknote","japan":"Shinto shrine","plate":"Fork and knife with plate",
 # ui
 "seedling":"Seedling","droplet":"Droplet","honey":"Honey pot","bee":"Honeybee","sparkles":"Sparkles","wilted":"Wilted flower",
 "sunflower":"Sunflower","puzzle":"Puzzle piece","trophy":"Trophy","fireflame":"Fire","party":"Party popper","calendar":"Spiral calendar",
 "watering":"Potted plant","book":"Open book","lock":"Locked","speaker":"Speaker high volume","caterpillar":"Bug","clover":"Four leaf clover",
 "cherries":"Cherries","snail":"Snail","butterfly":"Butterfly","basket":"Basket","hibiscus":"Hibiscus","leaves":"Leaf fluttering in wind",
 "egg":"Egg","cookedrice":"Cooked rice","teacup":"Teacup without handle","bento":"Bento box","door":"Door","crown":"Crown","teapot":"Teapot","chopsticks":"Chopsticks","dango":"Dango","rabbit":"Rabbit face","turtle":"Turtle","hamster":"Hamster","pig":"Pig face","lantern":"Red paper lantern","hourglass":"Hourglass not done","coin":"Coin","heartribbon":"Heart with ribbon","hatching":"Hatching chick","babychick":"Front-facing baby chick","fishcake":"Fish cake with swirl","cart":"Shopping cart","abacus":"Abacus","k1":"Keycap 1","k2":"Keycap 2","k3":"Keycap 3","k4":"Keycap 4","k5":"Keycap 5","k6":"Keycap 6","k7":"Keycap 7","k8":"Keycap 8","k9":"Keycap 9","k10":"Keycap 10","hundred":"Hundred points","moneybag":"Money bag","moneywings":"Money with wings","left":"Left arrow","right":"Right arrow","pencil":"Pencil","bricks":"Brick","train":"High-speed train","tracks":"Railway track","japanmap":"Map of Japan","ticket":"Ticket","dice":"Game die","check":"Check mark button","question":"Red question mark","gift":"Wrapped gift",
}

def snake(n): return n.lower().replace(" ","_")

def get(name):
    base="https://raw.githubusercontent.com/microsoft/fluentui-emoji/main/assets/"
    s=snake(name)
    for path in [f"{name}/3D/{s}_3d.png", f"{name}/Default/3D/{s}_3d_default.png"]:
        url=base+urllib.parse.quote(path)
        try:
            return urllib.request.urlopen(url, timeout=30).read()
        except Exception:
            pass
    return None

out={}; fails=[]
cache={}
for k,n in NAMES.items():
    data=cache.get(n) or get(n)
    if not data: fails.append((k,n)); continue
    cache[n]=data
    im=Image.open(io.BytesIO(data)).convert("RGBA").resize((112,112), Image.LANCZOS)
    b=io.BytesIO(); im.save(b,"WEBP",quality=82,method=6)
    out[k]="data:image/webp;base64,"+base64.b64encode(b.getvalue()).decode()
json.dump(out, open(sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "assets", "emoji.json"), "w"))
print("ok",len(out),"fails",fails, "bytes", sum(len(v) for v in out.values()))
