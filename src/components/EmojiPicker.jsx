/* @source src/components/EmojiPicker.jsx */
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { 
    ClockCircle, SmileCircle, User, Paw, 
    HamburgerMenu, MapPoint, Tennis, 
    Lightbulb, Hashtag, Flag, Magnifer, CloseCircle,
    TrashBinTrash
} from "@solar-icons/react";
import '../styles/EmojiPicker.css';



const RU_TO_EN_MAP = {
    'сме': 'laugh', 'улыб': 'smile', 'груст': 'sad', 'плач': 'cry', 'слез': 'cry', 'зл': 'angry',
    'люб': 'love', 'сердц': 'heart', 'кот': 'cat', 'кошк': 'cat', 'собак': 'dog', 'пес': 'dog', 'пёс': 'dog',
    'огон': 'fire', 'вод': 'water', 'дом': 'house', 'маш': 'car', 'авто': 'car',
    'ед': 'food', 'куш': 'food', 'яблок': 'apple', 'рук': 'hand', 'пальц': 'finger', 'глаз': 'eye',
    'деньг': 'money', 'доллар': 'dollar', 'солнц': 'sun', 'лун': 'moon', 'звезд': 'star',
    'флаг': 'flag', 'росс': 'russia', 'укр': 'ukraine', 'сша': 'usa', 'мир': 'peace',
    'работ': 'work', 'офис': 'office', 'комп': 'computer', 'телеф': 'phone',
    'врем': 'time', 'час': 'watch', 'книг': 'book', 'музык': 'music', 'игр': 'game',
    'спорт': 'sport', 'футбол': 'soccer', 'теннис': 'tennis', 'подар': 'gift',
    'праздн': 'party', 'торт': 'cake', 'пив': 'beer', 'вин': 'wine', 'кофе': 'coffee',
    'чай': 'tea', 'пицц': 'pizza', 'бургер': 'burger', 'фрукт': 'fruit', 'овощ': 'vegetable',
    'дерев': 'tree', 'цвет': 'flower', 'роз': 'rose', 'дожд': 'rain', 'снег': 'snow',
    'лет': 'summer', 'зим': 'winter', 'ок': 'ok', 'да': 'yes', 'нет': 'no',
    'привет': 'wave', 'пок': 'bye', 'спас': 'pray', 'сил': 'muscle', 'череп': 'skull',
    'призрак': 'ghost', 'кака': 'poop', 'гавн': 'poop', 'клоун': 'clown', 'робот': 'robot', 'инопл': 'alien',
    'красн': 'red', 'син': 'blue', 'зелен': 'green', 'желт': 'yellow', 'черн': 'black', 'бел': 'white',
    'одежд': 'shirt', 'штан': 'pants', 'плат': 'dress', 'обув': 'shoe', 'кроссов': 'shoe',
    'шапк': 'hat', 'очк': 'glasses', 'кольц': 'ring', 'сумк': 'bag', 'рюкзак': 'backpack',
    'нож': 'knife', 'вилк': 'fork', 'ложк': 'spoon', 'тарелк': 'plate', 'кружк': 'cup',
    'стакан': 'glass', 'бутылк': 'bottle', 'мяс': 'meat', 'рыб': 'fish', 'куриц': 'chicken',
    'яйц': 'egg', 'сыр': 'cheese', 'хлеб': 'bread', 'молок': 'milk', 'сок': 'juice',
    'сладк': 'candy', 'конфет': 'candy', 'морожен': 'ice cream', 'шоколад': 'chocolate',
    'печень': 'cookie', 'пирожн': 'cake', 'десерт': 'dessert', 'ягод': 'berry', 'арбуз': 'watermelon',
    'дыня': 'melon', 'виноград': 'grape', 'банан': 'banana', 'апельсин': 'orange', 'лимон': 'lemon',
    'груш': 'pear', 'персик': 'peach', 'вишн': 'cherry', 'клубник': 'strawberry', 'орех': 'nut',
    'картош': 'potato', 'морков': 'carrot', 'капуст': 'cabbage', 'лук': 'onion', 'чеснок': 'garlic',
    'перец': 'pepper', 'огурец': 'cucumber', 'помидор': 'tomato', 'гриб': 'mushroom',
    'медвед': 'bear', 'лис': 'fox', 'волк': 'wolf', 'заяц': 'rabbit', 'кролик': 'rabbit',
    'мыш': 'mouse', 'крыс': 'rat', 'хомяк': 'hamster', 'свинь': 'pig', 'коров': 'cow',
    'лошад': 'horse', 'овц': 'sheep', 'коз': 'goat', 'олен': 'deer', 'обезьян': 'monkey',
    'слон': 'elephant', 'лев': 'lion', 'тигр': 'tiger', 'леопард': 'leopard', 'зебр': 'zebra',
    'жираф': 'giraffe', 'верблюд': 'camel', 'носорог': 'rhinoceros', 'бегемот': 'hippo',
    'кенгуру': 'kangaroo', 'панд': 'panda', 'коал': 'koala', 'летуч': 'bat', 'птиц': 'bird',
    'петух': 'rooster', 'цыплен': 'chick', 'пингвин': 'penguin', 'орел': 'eagle', 'утк': 'duck',
    'лебед': 'swan', 'сов': 'owl', 'павлин': 'peacock', 'попугай': 'parrot', 'лягушк': 'frog',
    'крокодил': 'crocodile', 'черепах': 'turtle', 'ящериц': 'lizard', 'зме': 'snake', 'дракон': 'dragon',
    'динозавр': 'dinosaur', 'кит': 'whale', 'дельфин': 'dolphin', 'акул': 'shark', 'осьминог': 'octopus',
    'краб': 'crab', 'креветк': 'shrimp', 'кальмар': 'squid', 'улитк': 'snail', 'бабочк': 'butterfly',
    'жук': 'bug', 'мурав': 'ant', 'пчел': 'bee', 'божь': 'ladybug', 'паук': 'spider', 'скорпион': 'scorpion',
    'комар': 'mosquito', 'мух': 'fly', 'черв': 'worm', 'девоч': 'girl', 'мальч': 'boy',
    'женщ': 'woman', 'мужч': 'man', 'баб': 'old woman', 'дед': 'old man', 'ребен': 'baby',
    'семь': 'family', 'свадьб': 'wedding', 'брак': 'wedding', 'поцел': 'kiss', 'обним': 'hug',
    'спл': 'sleep', 'сон': 'sleep', 'устал': 'tired', 'шок': 'scream', 'страх': 'fear',
    'боль': 'hurt', 'болез': 'sick', 'врач': 'doctor', 'учит': 'teacher', 'школ': 'school',
    'инструм': 'tool', 'зам': 'lock', 'оружи': 'weapon', 'короб': 'box', 'письм': 'mail', 
    'бумаг': 'paper', 'ручк': 'pen', 'каранд': 'pencil', 'картин': 'picture', 'фот': 'camera', 
    'камер': 'camera', 'кино': 'movie', 'телевиз': 'tv', 'планет': 'planet', 'космос': 'space', 
    'ракет': 'rocket', 'самол': 'airplane', 'лодк': 'boat', 'велосип': 'bike', 'мото': 'motorcycle',
    'дорог': 'road', 'светоф': 'traffic light', 'мост': 'bridge', 'гор': 'mountain', 'остров': 'island',
    'пляж': 'beach', 'лес': 'forest', 'парк': 'park', 'город': 'city', 'деревн': 'village',
    'строит': 'construction', 'завод': 'factory', 'больниц': 'hospital', 'банк': 'bank', 'магаз': 'store',
    'крест': 'cross', 'знак': 'sign', 'стрел': 'arrow', 'круг': 'circle', 'квадрат': 'square',
    'треугол': 'triangle', 'линий': 'line', 'галочк': 'check', 'крестик': 'cross', 'вопрос': 'question',
    'восклиц': 'exclamation', 'цифр': 'number', 'букв': 'letter', 'язык': 'language', 'маги': 'magic',
    'волшеб': 'magic', 'корол': 'king', 'королев': 'queen', 'принц': 'prince', 'ангел': 'angel',
    'демон': 'devil', 'черт': 'devil', 'смерт': 'skull', 'монстр': 'monster', 'зомб': 'zombie',
    'вампир': 'vampire', 'эльф': 'elf', 'гном': 'goblin', 'единорог': 'unicorn', 'идея': 'bulb',
    'беларус': 'belarus', 'казах': 'kazakhstan', 'армен': 'armenia', 'грузи': 'georgia', 'азерб': 'azerbaijan',
    'узбек': 'uzbekistan', 'таджик': 'tajikistan', 'киргиз': 'kyrgyzstan', 'туркмен': 'turkmenistan', 'молдав': 'moldova',
    'эстон': 'estonia', 'латв': 'latvia', 'литв': 'lithuania', 'итал': 'italy', 'испан': 'spain',
    'португал': 'portugal', 'польш': 'poland', 'чехи': 'czechia', 'словаки': 'slovakia', 'венгри': 'hungary',
    'румын': 'romania', 'болгар': 'bulgaria', 'серби': 'serbia', 'хорвати': 'croatia', 'словени': 'slovenia',
    'греци': 'greece', 'турци': 'turkey', 'кипр': 'cyprus', 'китай': 'china', 'япон': 'japan',
    'коре': 'korea', 'инди': 'india', 'австрал': 'australia', 'канад': 'canada', 'бразил': 'brazil'
};


const EMOJI_DATA = [
    {
        id: 'smileys', icon: <SmileCircle />, title: 'Смайлы и эмоции',
        items: [
            { c: '😀', k: 'smile happy face' }, { c: '😃', k: 'smiley happy' }, { c: '😄', k: 'smile eye' },
            { c: '😁', k: 'grin' }, { c: '😆', k: 'laugh closed eyes' }, { c: '😅', k: 'sweat smile' },
            { c: '😂', k: 'joy laugh cry' }, { c: '🤣', k: 'rofl floor' }, { c: '🥲', k: 'tear smile' },
            { c: '🥹', k: 'holding back tears proud' }, { c: '🥰', k: 'love hearts' }, { c: '😍', k: 'love eye' }, 
            { c: '🤩', k: 'star eyes' }, { c: '😘', k: 'kiss' }, { c: '😗', k: 'kissing' }, 
            { c: '😋', k: 'yum tasty' }, { c: '😛', k: 'tongue' }, { c: '😜', k: 'wink tongue' }, 
            { c: '🤪', k: 'zany crazy' }, { c: '🤨', k: 'raised eyebrow' }, { c: '🧐', k: 'monocle' }, 
            { c: '🤓', k: 'nerd' }, { c: '😎', k: 'cool sunglasses' }, { c: '🥸', k: 'disguise mustache glasses' }, 
            { c: '🥳', k: 'party' }, { c: '😏', k: 'smirk' }, { c: '😒', k: 'unamused' }, 
            { c: '😞', k: 'disappointed' }, { c: '😔', k: 'pensive' }, { c: '😟', k: 'worried' }, 
            { c: '😕', k: 'confused' }, { c: '🫤', k: 'diagonal mouth' }, { c: '🙁', k: 'frown' }, 
            { c: '😫', k: 'tired' }, { c: '🥺', k: 'pleading' }, { c: '😭', k: 'cry loud' },
            { c: '😤', k: 'triumph steam' }, { c: '😠', k: 'angry' }, { c: '😡', k: 'rage red' },
            { c: '🤬', k: 'cursing' }, { c: '🤯', k: 'mind blown' }, { c: '😳', k: 'flushed' },
            { c: '🥵', k: 'hot' }, { c: '🥶', k: 'cold' }, { c: '😱', k: 'scream' },
            { c: '😨', k: 'fear' }, { c: '😰', k: 'sweat fear' }, { c: '😥', k: 'sad sweat' },
            { c: '😓', k: 'sweat' }, { c: '🤗', k: 'hug' }, { c: '🤔', k: 'thinking' },
            { c: '🫣', k: 'peeking eye' }, { c: '🤭', k: 'hand over mouth' }, { c: '🫢', k: 'open eyes hand mouth' }, 
            { c: '🫡', k: 'saluting' }, { c: '🤫', k: 'shush quiet' }, { c: '🤥', k: 'liar pinocchio' },
            { c: '😶', k: 'no mouth' }, { c: '🫥', k: 'dotted line face invisible' }, { c: '😐', k: 'neutral' }, 
            { c: '😑', k: 'expressionless' }, { c: '😬', k: 'grimace' }, { c: '🙄', k: 'roll eyes' }, 
            { c: '😯', k: 'hushed' }, { c: '😦', k: 'frowning open' }, { c: '😧', k: 'anguished' }, 
            { c: '😮', k: 'open mouth' }, { c: '😲', k: 'astonished' }, { c: '🥱', k: 'yawning' }, 
            { c: '😴', k: 'sleeping' }, { c: '🤤', k: 'drooling' }, { c: '😪', k: 'sleepy' }, 
            { c: '😵', k: 'dizzy' }, { c: '💫', k: 'dizzy star' }, { c: '🤐', k: 'zipper' }, 
            { c: '🥴', k: 'woozy drunk' }, { c: '🤢', k: 'nauseated' }, { c: '🤮', k: 'vomit' }, 
            { c: '🤧', k: 'sneeze' }, { c: '😷', k: 'mask' }, { c: '🤒', k: 'thermometer' }, 
            { c: '🤕', k: 'bandage' }, { c: '🤑', k: 'money' }, { c: '🤠', k: 'cowboy' }, 
            { c: '😈', k: 'devil smile' }, { c: '👿', k: 'devil angry' }, { c: '👹', k: 'oni' }, 
            { c: '👺', k: 'goblin' }, { c: '🤡', k: 'clown' }, { c: '💩', k: 'poop' }, 
            { c: '👻', k: 'ghost' }, { c: '💀', k: 'skull' }, { c: '☠️', k: 'crossbones' }, 
            { c: '👽', k: 'alien' }, { c: '👾', k: 'monster' }, { c: '🤖', k: 'robot' },
            { c: '😺', k: 'cat smile' }, { c: '😸', k: 'cat grin' }, { c: '😹', k: 'cat laugh tears' },
            { c: '😻', k: 'cat love heart' }, { c: '😼', k: 'cat smirk' }, { c: '😽', k: 'cat kiss' },
            { c: '🙀', k: 'cat scream' }, { c: '😿', k: 'cat cry' }, { c: '😾', k: 'cat angry pout' },
            { c: '🙈', k: 'monkey blind' }, { c: '🙉', k: 'monkey deaf' }, { c: '🙊', k: 'monkey mute' },
            { c: '💋', k: 'kiss mark lips' }, { c: '💌', k: 'love letter' }, { c: '💘', k: 'heart arrow' },
            { c: '💝', k: 'heart ribbon' }, { c: '💖', k: 'sparkling heart' }, { c: '💗', k: 'growing heart' },
            { c: '💓', k: 'beating heart' }, { c: '💞', k: 'revolving hearts' }, { c: '💕', k: 'two hearts' },
            { c: '💟', k: 'heart decoration' }, { c: '❣️', k: 'heart exclamation' }, { c: '💔', k: 'broken heart' },
            { c: '❤️‍🔥', k: 'heart on fire' }, { c: '❤️‍🩹', k: 'mending heart' }, { c: '❤️', k: 'red heart' },
            { c: '🩷', k: 'pink heart' }, { c: '🧡', k: 'orange heart' }, { c: '💛', k: 'yellow heart' },
            { c: '💚', k: 'green heart' }, { c: '💙', k: 'blue heart' }, { c: '🩵', k: 'light blue heart' },
            { c: '💜', k: 'purple heart' }, { c: '🤎', k: 'brown heart' }, { c: '🖤', k: 'black heart' },
            { c: '🤍', k: 'white heart' }
        ]
    },
    {
        id: 'people', icon: <User />, title: 'Люди и тело',
        items: [
            { c: '👋', k: 'wave hand' }, { c: '🤚', k: 'back of hand' }, { c: '🖐️', k: 'fingers splayed' },
            { c: '✋', k: 'raised hand' }, { c: '🖖', k: 'vulcan' }, { c: '🫱', k: 'rightward hand' }, 
            { c: '🫲', k: 'leftward hand' }, { c: '🫳', k: 'palm down' }, { c: '🫴', k: 'palm up' }, 
            { c: '👌', k: 'ok' }, { c: '🤌', k: 'pinched fingers' }, { c: '🤏', k: 'pinching' }, 
            { c: '✌️', k: 'victory peace' }, { c: '🤞', k: 'crossed fingers' }, { c: '🤟', k: 'love you' }, 
            { c: '🤘', k: 'rock on' }, { c: '🤙', k: 'call me' }, { c: '👈', k: 'point left' }, 
            { c: '👉', k: 'point right' }, { c: '👆', k: 'point up' }, { c: '🖕', k: 'middle finger' }, 
            { c: '👇', k: 'point down' }, { c: '☝️', k: 'index pointing up' }, { c: '👍', k: 'thumbs up' }, 
            { c: '👎', k: 'thumbs down' }, { c: '✊', k: 'fist raised' }, { c: '👊', k: 'fist oncoming' }, 
            { c: '🤛', k: 'left fist' }, { c: '🤜', k: 'right fist' }, { c: '👏', k: 'clap' }, 
            { c: '🙌', k: 'hands raised' }, { c: '🫶', k: 'heart hands' }, { c: '👐', k: 'open hands' }, 
            { c: '🤲', k: 'palms up together' }, { c: '🤝', k: 'handshake' }, { c: '🙏', k: 'pray thanks' }, 
            { c: '✍️', k: 'writing hand' }, { c: '💅', k: 'nail polish' }, { c: '🤳', k: 'selfie' },
            { c: '💪', k: 'muscle bicep' }, { c: '🦾', k: 'mechanical arm' }, { c: '🦿', k: 'mechanical leg' }, 
            { c: '🦵', k: 'leg' }, { c: '🦶', k: 'foot' }, { c: '👂', k: 'ear' }, { c: '🦻', k: 'ear hearing aid' }, 
            { c: '👃', k: 'nose' }, { c: '🧠', k: 'brain' }, { c: '🫀', k: 'heart organ anatomical' }, 
            { c: '🫁', k: 'lungs' }, { c: '🦷', k: 'tooth' }, { c: '🦴', k: 'bone' }, { c: '👀', k: 'eyes' }, 
            { c: '👁️', k: 'eye' }, { c: '👅', k: 'tongue mouth' }, { c: '👄', k: 'lips mouth' }, 
            { c: '🫦', k: 'biting lip' }, { c: '👶', k: 'baby' }, { c: '👧', k: 'girl' },
            { c: '🧒', k: 'child' }, { c: '👦', k: 'boy' }, { c: '👩', k: 'woman' },
            { c: '🧑', k: 'person' }, { c: '👨', k: 'man' }, { c: '👱‍♀️', k: 'blond woman' }, 
            { c: '👱‍♂️', k: 'blond man' }, { c: '🧔', k: 'bearded' }, { c: '👵', k: 'old woman' }, 
            { c: '🧓', k: 'older person' }, { c: '👴', k: 'old man' }, { c: '👲', k: 'cap' }, 
            { c: '🧕', k: 'hijab' }, { c: '👳‍♀️', k: 'turban woman' }, { c: '👳‍♂️', k: 'turban man' }, 
            { c: '👮', k: 'police' }, { c: '👷', k: 'construction worker' }, { c: '💂', k: 'guard' }, 
            { c: '🕵️', k: 'detective' }, { c: '🧑‍⚕️', k: 'doctor health' }, { c: '🧑‍🌾', k: 'farmer' }, 
            { c: '🧑‍🍳', k: 'chef cook' }, { c: '🧑‍🎓', k: 'student graduate' }, { c: '🧑‍🎤', k: 'singer' }, 
            { c: '🧑‍🏫', k: 'teacher' }, { c: '🧑‍🏭', k: 'factory worker' }, { c: '🧑‍💻', k: 'technologist computer' }, 
            { c: '🧑‍💼', k: 'office worker' }, { c: '🧑‍🔧', k: 'mechanic' }, { c: '🧑‍🔬', k: 'scientist' }, 
            { c: '🧑‍🎨', k: 'artist' }, { c: '🧑‍🚒', k: 'firefighter' }, { c: '🧑‍✈️', k: 'pilot' }, 
            { c: '🧑‍🚀', k: 'astronaut space' }, { c: '🧑‍⚖️', k: 'judge' }, { c: '🥷', k: 'ninja' }, 
            { c: '🦸', k: 'hero' }, { c: '🦹', k: 'villain' }, { c: '🧙', k: 'mage wizard' }, 
            { c: '🧚', k: 'fairy' }, { c: '🧛', k: 'vampire' }, { c: '🧜', k: 'merperson mermaid' }, 
            { c: '🧝', k: 'elf' }, { c: '🧞', k: 'genie' }, { c: '🧟', k: 'zombie' }, 
            { c: '👼', k: 'angel baby' }, { c: '🤰', k: 'pregnant' }, { c: '🤱', k: 'breast feeding' }, 
            { c: '🙇', k: 'bowing' }, { c: '💁', k: 'information desk' }, { c: '🙅', k: 'no gesture' }, 
            { c: '🙆', k: 'ok gesture' }, { c: '🙋', k: 'raising hand' }, { c: '🧏', k: 'deaf' }, 
            { c: '🤦', k: 'facepalm' }, { c: '🤷', k: 'shrug' }, { c: '🙎', k: 'pouting' }, 
            { c: '🙍', k: 'frowning' }, { c: '💇', k: 'haircut' }, { c: '💆', k: 'massage' }, 
            { c: '🧖', k: 'sauna' }, { c: '💅', k: 'nail polish' }, { c: '🕴️', k: 'levitating' }, 
            { c: '💃', k: 'dancer woman' }, { c: '🕺', k: 'dancer man' }, { c: '👯', k: 'party people bunny' }, 
            { c: '🚶', k: 'walking' }, { c: '🏃', k: 'running' }, { c: '🧍', k: 'standing' }, 
            { c: '🧎', k: 'kneeling' }, { c: '🧑‍🦯', k: 'blind cane' }, { c: '🧑‍🦼', k: 'motorized wheelchair' }, 
            { c: '🧑‍🦽', k: 'manual wheelchair' }, { c: '👫', k: 'couple man woman' }, { c: '👬', k: 'couple men' }, 
            { c: '👭', k: 'couple women' }, { c: '💏', k: 'kiss couple' }, { c: '💑', k: 'couple heart' }, 
            { c: '👨‍👩‍👦', k: 'family child' }, { c: '👨‍👩‍👧', k: 'family girl' }, { c: '👨‍👩‍👧‍👦', k: 'family kids' },
            { c: '👣', k: 'footprints' }, { c: '👕', k: 't-shirt shirt' }, { c: '👖', k: 'jeans pants' }, 
            { c: '🩳', k: 'shorts' }, { c: '👔', k: 'necktie' }, { c: '👗', k: 'dress' }, 
            { c: '👙', k: 'bikini' }, { c: '🩱', k: 'one-piece swimsuit' }, { c: '👘', k: 'kimono' }, 
            { c: '🥻', k: 'sari' }, { c: '🩲', k: 'briefs underwear' }, { c: '🩲', k: 'swim brief' }, 
            { c: '🧥', k: 'coat jacket' }, { c: '🧤', k: 'gloves' }, { c: '🧣', k: 'scarf' }, 
            { c: '🧦', k: 'socks' }, { c: '🥾', k: 'hiking boot' }, { c: '👟', k: 'sneaker shoe' }, 
            { c: '👞', k: 'man shoe' }, { c: '👠', k: 'high heel' }, { c: '👡', k: 'sandal' }, 
            { c: '👢', k: 'woman boot' }, { c: '🥿', k: 'flat shoe' }, { c: '🩴', k: 'thong sandal' }, 
            { c: '👑', k: 'crown' }, { c: '👒', k: 'woman hat' }, { c: '🎩', k: 'top hat' }, 
            { c: '🎓', k: 'graduation cap' }, { c: '🧢', k: 'billed cap baseball' }, { c: '🪖', k: 'military helmet' }, 
            { c: '⛑️', k: 'rescue worker helmet' }, { c: '💄', k: 'lipstick' }, { c: '💍', k: 'ring' }, 
            { c: '💼', k: 'briefcase' }
        ]
    },
    {
        id: 'nature', icon: <Paw />, title: 'Природа и животные',
        items: [
            { c: '🐵', k: 'monkey face' }, { c: '🐒', k: 'monkey' }, { c: '🦍', k: 'gorilla' }, 
            { c: '🦧', k: 'orangutan' }, { c: '🐶', k: 'dog face' }, { c: '🐕', k: 'dog' }, 
            { c: '🦮', k: 'guide dog' }, { c: '🐕‍🦺', k: 'service dog' }, { c: '🐩', k: 'poodle' },
            { c: '🐺', k: 'wolf' }, { c: '🦊', k: 'fox' }, { c: '🦝', k: 'raccoon' },
            { c: '🐱', k: 'cat face' }, { c: '🐈', k: 'cat' }, { c: '🐈‍⬛', k: 'black cat' }, 
            { c: '🦁', k: 'lion' }, { c: '🐯', k: 'tiger face' }, { c: '🐅', k: 'tiger' }, 
            { c: '🐆', k: 'leopard' }, { c: '🐴', k: 'horse face' }, { c: '🐎', k: 'horse' }, 
            { c: '🦄', k: 'unicorn' }, { c: '🦓', k: 'zebra' }, { c: '🦌', k: 'deer' }, 
            { c: '🫎', k: 'moose' }, { c: '🐮', k: 'cow face' }, { c: '🐂', k: 'ox' }, 
            { c: '🐃', k: 'water buffalo' }, { c: '🐄', k: 'cow' }, { c: '🐷', k: 'pig face' }, 
            { c: '🐖', k: 'pig' }, { c: '🐗', k: 'boar' }, { c: '🐽', k: 'pig nose' }, 
            { c: '🐏', k: 'ram' }, { c: '🐑', k: 'sheep' }, { c: '🐐', k: 'goat' }, 
            { c: '🐪', k: 'camel' }, { c: '🐫', k: 'two-hump camel' }, { c: '🦙', k: 'llama' }, 
            { c: '🦒', k: 'giraffe' }, { c: '🐘', k: 'elephant' }, { c: '🦣', k: 'mammoth' }, 
            { c: '🦏', k: 'rhinoceros' }, { c: '🦛', k: 'hippo' }, { c: '🐭', k: 'mouse face' },
            { c: '🐁', k: 'mouse' }, { c: '🐀', k: 'rat' }, { c: '🐹', k: 'hamster' },
            { c: '🐰', k: 'rabbit face' }, { c: '🐇', k: 'rabbit' }, { c: '🐿️', k: 'chipmunk' },
            { c: '🦫', k: 'beaver' }, { c: '🦔', k: 'hedgehog' }, { c: '🦇', k: 'bat' }, 
            { c: '🐻', k: 'bear' }, { c: '🐻‍❄️', k: 'polar bear' }, { c: '🐨', k: 'koala' }, 
            { c: '🐼', k: 'panda' }, { c: '🦥', k: 'sloth' }, { c: '🦦', k: 'otter' }, 
            { c: '🦨', k: 'skunk' }, { c: '🦘', k: 'kangaroo' }, { c: '🦡', k: 'badger' }, 
            { c: '🐾', k: 'paw prints' }, { c: '🦃', k: 'turkey' }, { c: '🐔', k: 'chicken' },
            { c: '🐓', k: 'rooster' }, { c: '🐣', k: 'hatching chick' }, { c: '🐤', k: 'baby chick' },
            { c: '🐥', k: 'front chick' }, { c: '🐦', k: 'bird' }, { c: '🐧', k: 'penguin' },
            { c: '🕊️', k: 'dove peace' }, { c: '🦅', k: 'eagle' }, { c: '🦆', k: 'duck' },
            { c: '🦢', k: 'swan' }, { c: '🦉', k: 'owl' }, { c: '🦤', k: 'dodo' }, 
            { c: '🪶', k: 'feather' }, { c: '🦩', k: 'flamingo' }, { c: '🦚', k: 'peacock' }, 
            { c: '🦜', k: 'parrot' }, { c: '🐸', k: 'frog' }, { c: '🐊', k: 'crocodile' }, 
            { c: '🐢', k: 'turtle' }, { c: '🦎', k: 'lizard' }, { c: '🐍', k: 'snake' }, 
            { c: '🐲', k: 'dragon face' }, { c: '🐉', k: 'dragon' }, { c: '🦕', k: 'sauropod dinosaur' }, 
            { c: '🦖', k: 't-rex dinosaur' }, { c: '🐳', k: 'whale' }, { c: '🐋', k: 'spouting whale' }, 
            { c: '🐬', k: 'dolphin' }, { c: '🦭', k: 'seal' }, { c: '🐟', k: 'fish' }, 
            { c: '🐠', k: 'tropical fish' }, { c: '🐡', k: 'blowfish' }, { c: '🦈', k: 'shark' }, 
            { c: '🐙', k: 'octopus' }, { c: '🐚', k: 'shell' }, { c: '🪸', k: 'coral' }, 
            { c: '🐌', k: 'snail' }, { c: '🦋', k: 'butterfly' }, { c: '🐛', k: 'bug' }, 
            { c: '🐜', k: 'ant' }, { c: '🐝', k: 'honeybee' }, { c: '🪲', k: 'beetle' }, 
            { c: '🐞', k: 'lady_beetle' }, { c: '🦗', k: 'cricket' }, { c: '🪳', k: 'cockroach' }, 
            { c: '🕷️', k: 'spider' }, { c: '🕸️', k: 'spider web' }, { c: '🦂', k: 'scorpion' }, 
            { c: '🦟', k: 'mosquito' }, { c: '🪰', k: 'fly' }, { c: '🪱', k: 'worm' }, 
            { c: '🦠', k: 'microbe virus' }, { c: '💐', k: 'bouquet' }, { c: '🌸', k: 'cherry blossom' }, 
            { c: '💮', k: 'white flower' }, { c: '🏵️', k: 'rosette' }, { c: '🌹', k: 'rose' }, 
            { c: '🥀', k: 'wilted flower' }, { c: '🌺', k: 'hibiscus' }, { c: '🌻', k: 'sunflower' }, 
            { c: '🌼', k: 'blossom' }, { c: '🌷', k: 'tulip' }, { c: '🌱', k: 'seedling' }, 
            { c: '🪴', k: 'potted plant' }, { c: '🌲', k: 'evergreen tree pine' }, { c: '🌳', k: 'deciduous tree' },
            { c: '🌴', k: 'palm tree' }, { c: '🌵', k: 'cactus' }, { c: '🌾', k: 'sheaf of rice' },
            { c: '🌿', k: 'herb' }, { c: '☘️', k: 'shamrock' }, { c: '🍀', k: 'four leaf clover' },
            { c: '🍁', k: 'maple leaf' }, { c: '🍂', k: 'fallen leaf' }, { c: '🍃', k: 'leaf flutter' },
            { c: '🌍', k: 'earth globe' }, { c: '🌎', k: 'earth americas' }, { c: '🌏', k: 'earth asia' }, 
            { c: '🌕', k: 'full moon' }, { c: '🌖', k: 'waning gibbous moon' }, { c: '🌗', k: 'last quarter moon' }, 
            { c: '🌘', k: 'waning crescent moon' }, { c: '🌑', k: 'new moon' }, { c: '🌒', k: 'waxing crescent moon' }, 
            { c: '🌓', k: 'first quarter moon' }, { c: '🌔', k: 'waxing gibbous moon' }, { c: '🌙', k: 'moon' }, 
            { c: '🌚', k: 'new moon face' }, { c: '🌛', k: 'first quarter moon face' }, { c: '🌜', k: 'last quarter moon face' }, 
            { c: '☀️', k: 'sun' }, { c: '🌝', k: 'full moon face' }, { c: '🌞', k: 'sun face' }, 
            { c: '⭐', k: 'star' }, { c: '🌟', k: 'glowing star' }, { c: '🌠', k: 'shooting star' }, 
            { c: '☁️', k: 'cloud' }, { c: '⛅', k: 'sun behind cloud' }, { c: '⛈️', k: 'storm' }, 
            { c: '🌤️', k: 'sun small cloud' }, { c: '🌥️', k: 'sun large cloud' }, { c: '🌦️', k: 'sun behind rain cloud' }, 
            { c: '🌧️', k: 'rain cloud' }, { c: '🌨️', k: 'snow cloud' }, { c: '🌩️', k: 'lightning cloud' }, 
            { c: '🌪️', k: 'tornado' }, { c: '🌫️', k: 'fog' }, { c: '🌬️', k: 'wind face' }, 
            { c: '🌀', k: 'cyclone' }, { c: '🌈', k: 'rainbow' }, { c: '🌂', k: 'closed umbrella' }, 
            { c: '☂️', k: 'umbrella' }, { c: '☔', k: 'umbrella rain' }, { c: '⛱️', k: 'umbrella ground' }, 
            { c: '⚡', k: 'high voltage lightning' }, { c: '❄️', k: 'snowflake' }, { c: '☃️', k: 'snowman snow' }, 
            { c: '⛄', k: 'snowman' }, { c: '☄️', k: 'comet' }, { c: '🔥', k: 'fire' }, 
            { c: '💧', k: 'droplet' }, { c: '🌊', k: 'water wave' }, { c: '✨', k: 'sparkles' }
        ]
    },
    {
        id: 'food', icon: <HamburgerMenu />, title: 'Еда и напитки',
        items: [
            { c: '🍏', k: 'green apple' }, { c: '🍎', k: 'red apple' }, { c: '🍐', k: 'pear' },
            { c: '🍊', k: 'orange tangerine' }, { c: '🍋', k: 'lemon' }, { c: '🍌', k: 'banana' },
            { c: '🍉', k: 'watermelon' }, { c: '🍇', k: 'grape' }, { c: '🍓', k: 'strawberry' },
            { c: '🫐', k: 'blueberries' }, { c: '🍈', k: 'melon' }, { c: '🍒', k: 'cherries' }, 
            { c: '🍑', k: 'peach' }, { c: '🥭', k: 'mango' }, { c: '🍍', k: 'pineapple' }, 
            { c: '🥥', k: 'coconut' }, { c: '🥝', k: 'kiwi' }, { c: '🍅', k: 'tomato' }, 
            { c: '🍆', k: 'eggplant' }, { c: '🥑', k: 'avocado' }, { c: '🫛', k: 'pea pod' }, 
            { c: '🥦', k: 'broccoli' }, { c: '🥬', k: 'leafy green cabbage' }, { c: '🥒', k: 'cucumber' }, 
            { c: '🌶️', k: 'hot pepper chili' }, { c: '🫑', k: 'bell pepper' }, { c: '🌽', k: 'corn' }, 
            { c: '🥕', k: 'carrot' }, { c: '🫒', k: 'olive' }, { c: '🧄', k: 'garlic' }, 
            { c: '🧅', k: 'onion' }, { c: '🥔', k: 'potato' }, { c: '🍠', k: 'roasted sweet potato' }, 
            { c: '🥐', k: 'croissant' }, { c: '🥯', k: 'bagel' }, { c: '🍞', k: 'bread' }, 
            { c: '🥖', k: 'baguette' }, { c: '🥨', k: 'pretzel' }, { c: '🧀', k: 'cheese' }, 
            { c: '🥚', k: 'egg' }, { c: '🍳', k: 'cooking egg' }, { c: '🧈', k: 'butter' }, 
            { c: '🥞', k: 'pancakes' }, { c: '🧇', k: 'waffle' }, { c: '🥓', k: 'bacon' }, 
            { c: '🥩', k: 'cut of meat steak' }, { c: '🍗', k: 'poultry leg chicken' }, { c: '🍖', k: 'meat on bone' }, 
            { c: '🌭', k: 'hotdog' }, { c: '🍔', k: 'burger hamburger' }, { c: '🍟', k: 'fries' }, 
            { c: '🍕', k: 'pizza' }, { c: '🫓', k: 'flatbread' }, { c: '🥪', k: 'sandwich' }, 
            { c: '🥙', k: 'stuffed flatbread kebab' }, { c: '🧆', k: 'falafel' }, { c: '🌮', k: 'taco' }, 
            { c: '🌯', k: 'burrito' }, { c: '🫔', k: 'tamale' }, { c: '🥗', k: 'salad' }, 
            { c: '🥘', k: 'shallow pan of food' }, { c: '🫕', k: 'fondue' }, { c: '🥫', k: 'canned food' }, 
            { c: '🍝', k: 'spaghetti pasta' }, { c: '🍜', k: 'noodle bowl' }, { c: '🍲', k: 'pot of food soup' }, 
            { c: '🍛', k: 'curry rice' }, { c: '🍣', k: 'sushi' }, { c: '🍱', k: 'bento box' }, 
            { c: '🥟', k: 'dumpling' }, { c: '🦪', k: 'oyster' }, { c: '🍤', k: 'fried shrimp' }, 
            { c: '🍙', k: 'rice ball' }, { c: '🍚', k: 'rice bowl' }, { c: '🍘', k: 'rice cracker' }, 
            { c: '🍥', k: 'fish cake' }, { c: '🥠', k: 'fortune cookie' }, { c: '🥮', k: 'mooncake' }, 
            { c: '🍢', k: 'oden' }, { c: '🍡', k: 'dango' }, { c: '🍧', k: 'shaved ice' }, 
            { c: '🍨', k: 'ice cream' }, { c: '🍦', k: 'soft ice cream' }, { c: '🥧', k: 'pie' }, 
            { c: '🧁', k: 'cupcake' }, { c: '🍰', k: 'cake piece' }, { c: '🎂', k: 'cake birthday' }, 
            { c: '🍮', k: 'custard flan' }, { c: '🍭', k: 'lollipop candy' }, { c: '🍬', k: 'candy' }, 
            { c: '🍫', k: 'chocolate' }, { c: '🍿', k: 'popcorn' }, { c: '🍩', k: 'doughnut donut' }, 
            { c: '🍪', k: 'cookie' }, { c: '🌰', k: 'chestnut' }, { c: '🥜', k: 'peanuts' }, 
            { c: '🍯', k: 'honey pot' }, { c: '🥛', k: 'milk glass' }, { c: '🍼', k: 'baby bottle' }, 
            { c: '☕', k: 'coffee cup' }, { c: '🫖', k: 'teapot' }, { c: '🍵', k: 'teacup matcha' }, 
            { c: '🧃', k: 'beverage box juice' }, { c: '🥤', k: 'cup with straw' }, { c: '🧋', k: 'bubble tea boba' }, 
            { c: '🍶', k: 'sake' }, { c: '🍺', k: 'beer mug' }, { c: '🍻', k: 'clinking beer mugs' }, 
            { c: '🥂', k: 'clinking glasses' }, { c: '🍷', k: 'wine glass' }, { c: '🥃', k: 'tumbler glass whiskey' }, 
            { c: '🍸', k: 'cocktail glass' }, { c: '🍹', k: 'tropical drink' }, { c: '🧉', k: 'mate' }, 
            { c: '🧊', k: 'ice cube' }, { c: '🥢', k: 'chopsticks' }, { c: '🍽️', k: 'fork and knife with plate' }, 
            { c: '🍴', k: 'fork and knife' }, { c: '🥄', k: 'spoon' }, { c: '🔪', k: 'kitchen knife' }, 
            { c: '🫙', k: 'jar' }, { c: '🏺', k: 'amphora' }
        ]
    },
    {
        id: 'activity', icon: <Tennis />, title: 'Спорт и активности',
        items: [
            { c: '⚽', k: 'soccer football ball' }, { c: '🏀', k: 'basketball' }, { c: '🏈', k: 'american football' },
            { c: '⚾', k: 'baseball' }, { c: '🥎', k: 'softball' }, { c: '🎾', k: 'tennis' },
            { c: '🏐', k: 'volleyball' }, { c: '🏉', k: 'rugby' }, { c: '🥏', k: 'flying disc frisbee' },
            { c: '🎱', k: 'pool 8 ball billiard' }, { c: '🪀', k: 'yoyo' }, { c: '🏓', k: 'ping pong table tennis' }, 
            { c: '🏸', k: 'badminton' }, { c: '🏒', k: 'ice hockey' }, { c: '🏑', k: 'field hockey' }, 
            { c: '🥍', k: 'lacrosse' }, { c: '🏏', k: 'cricket' }, { c: '🪃', k: 'boomerang' }, 
            { c: '🥅', k: 'goal net' }, { c: '⛳', k: 'golf' }, { c: '🪁', k: 'kite' }, 
            { c: '🏹', k: 'bow and arrow' }, { c: '🎣', k: 'fishing rod' }, { c: '🤿', k: 'diving mask' }, 
            { c: '🥊', k: 'boxing glove' }, { c: '🥋', k: 'martial arts uniform' }, { c: '🎽', k: 'running shirt' }, 
            { c: '🛹', k: 'skateboard' }, { c: '🛼', k: 'roller skate' }, { c: '🛷', k: 'sled' }, 
            { c: '⛸️', k: 'ice skate' }, { c: '🥌', k: 'curling stone' }, { c: '🎿', k: 'skis' }, 
            { c: '⛷️', k: 'skier' }, { c: '🏂', k: 'snowboarder' }, { c: '🪂', k: 'parachute' }, 
            { c: '🏋️', k: 'weight lifter' }, { c: '🤼', k: 'wrestlers' }, { c: '🤸', k: 'cartwheeling' }, 
            { c: '⛹️', k: 'person bouncing ball' }, { c: '🤺', k: 'fencer' }, { c: '🏌️', k: 'golfer' }, 
            { c: '🏇', k: 'horse racing' }, { c: '🧘', k: 'person in lotus position yoga' }, { c: '🏄', k: 'surfer' }, 
            { c: '🏊', k: 'swimmer' }, { c: '🤽', k: 'water polo' }, { c: '🚣', k: 'rowing boat' }, 
            { c: '🧗', k: 'person climbing' }, { c: '🚵', k: 'mountain biker' }, { c: '🚴', k: 'bicyclist' }, 
            { c: '🏆', k: 'trophy' }, { c: '🥇', k: '1st place medal' }, { c: '🥈', k: '2nd place medal' }, 
            { c: '🥉', k: '3rd place medal' }, { c: '🏅', k: 'sports medal' }, { c: '🎖️', k: 'military medal' }, 
            { c: '🏵️', k: 'rosette' }, { c: '🎗️', k: 'reminder ribbon' }, { c: '🎫', k: 'ticket' }, 
            { c: '🎟️', k: 'admission tickets' }, { c: '🎪', k: 'circus tent' }, { c: '🤹', k: 'juggling' }, 
            { c: '🎭', k: 'performing arts theater mask' }, { c: '🩰', k: 'ballet shoes' }, { c: '🎨', k: 'artist palette' }, 
            { c: '🎬', k: 'clapper board' }, { c: '🎤', k: 'microphone' }, { c: '🎧', k: 'headphone' }, 
            { c: '🎼', k: 'musical score' }, { c: '🎹', k: 'musical keyboard piano' }, { c: '🥁', k: 'drum' }, 
            { c: '🎷', k: 'saxophone' }, { c: '🎺', k: 'trumpet' }, { c: '🎸', k: 'guitar' }, 
            { c: '🪕', k: 'banjo' }, { c: '🎻', k: 'violin' }, { c: '🎲', k: 'game die' }, 
            { c: '♟️', k: 'chess pawn' }, { c: '🎯', k: 'bullseye dart' }, { c: '🎳', k: 'bowling' }, 
            { c: '🎮', k: 'video game joystick' }, { c: '🎰', k: 'slot machine casino' }, { c: '🧩', k: 'puzzle piece' }
        ]
    },
    {
        id: 'places', icon: <MapPoint />, title: 'Места и Путешествия',
        items: [
            { c: '🚗', k: 'car automobile auto' }, { c: '🚕', k: 'taxi' }, { c: '🚙', k: 'suv' },
            { c: '🚌', k: 'bus' }, { c: '🚎', k: 'trolleybus' }, { c: '🏎️', k: 'racing car' }, 
            { c: '🚓', k: 'police car' }, { c: '🚑', k: 'ambulance' }, { c: '🚒', k: 'fire engine' }, 
            { c: '🚐', k: 'minibus' }, { c: '🚚', k: 'delivery truck' }, { c: '🚛', k: 'articulated lorry' }, 
            { c: '🚜', k: 'tractor' }, { c: '🦯', k: 'white cane' }, { c: '🦽', k: 'manual wheelchair' }, 
            { c: '🦼', k: 'motorized wheelchair' }, { c: '🛴', k: 'kick scooter' }, { c: '🚲', k: 'bicycle bike' }, 
            { c: '🛵', k: 'motor scooter' }, { c: '🏍️', k: 'motorcycle' }, { c: '🛺', k: 'auto rickshaw' }, 
            { c: '🚨', k: 'police car light siren' }, { c: '🚔', k: 'oncoming police car' }, { c: '🚍', k: 'oncoming bus' }, 
            { c: '🚘', k: 'oncoming automobile' }, { c: '🚖', k: 'oncoming taxi' }, { c: '🚡', k: 'aerial tramway' }, 
            { c: '🚠', k: 'mountain cableway' }, { c: '🚟', k: 'suspension railway' }, { c: '🚃', k: 'railway car' }, 
            { c: '🚋', k: 'tram car' }, { c: '🚞', k: 'mountain railway' }, { c: '🚝', k: 'monorail' }, 
            { c: '🚄', k: 'high-speed train' }, { c: '🚅', k: 'bullet train' }, { c: '🚈', k: 'light rail' }, 
            { c: '🚂', k: 'locomotive train' }, { c: '🚆', k: 'train' }, { c: '🚇', k: 'metro subway' }, 
            { c: '🚊', k: 'tram' }, { c: '🚉', k: 'station' }, { c: '✈️', k: 'airplane' }, 
            { c: '🛫', k: 'airplane departure' }, { c: '🛬', k: 'airplane arrival' }, { c: '🛩️', k: 'small airplane' }, 
            { c: '💺', k: 'seat' }, { c: '🛰️', k: 'satellite' }, { c: '🚀', k: 'rocket' }, 
            { c: '🛸', k: 'flying saucer ufo alien' }, { c: '🚁', k: 'helicopter' }, { c: '🛶', k: 'canoe boat' }, 
            { c: '⛵', k: 'sailboat' }, { c: '🚤', k: 'speedboat' }, { c: '🛥️', k: 'motor boat' }, 
            { c: '🛳️', k: 'passenger ship cruise' }, { c: '⛴️', k: 'ferry' }, { c: '🚢', k: 'ship boat' }, 
            { c: '⚓', k: 'anchor' }, { c: '🪝', k: 'hook' }, { c: '⛽', k: 'fuel pump gas station' }, 
            { c: '🚧', k: 'construction sign' }, { c: '🚦', k: 'vertical traffic light' }, { c: '🚥', k: 'horizontal traffic light' }, 
            { c: '🚏', k: 'bus stop' }, { c: '🗺️', k: 'world map' }, { c: '🗿', k: 'moai statue' }, 
            { c: '🗽', k: 'statue of liberty' }, { c: '🗼', k: 'tokyo tower' }, { c: '🏰', k: 'castle' }, 
            { c: '🏯', k: 'japanese castle' }, { c: '🏟️', k: 'stadium' }, { c: '🎡', k: 'ferris wheel' }, 
            { c: '🎢', k: 'roller coaster' }, { c: '🎠', k: 'carousel horse' }, { c: '⛲', k: 'fountain' }, 
            { c: '⛱️', k: 'umbrella on ground' }, { c: '🏖️', k: 'beach with umbrella' }, { c: '🏝️', k: 'desert island' }, 
            { c: '🏜️', k: 'desert' }, { c: '🌋', k: 'volcano' }, { c: '⛰️', k: 'mountain' }, 
            { c: '🏔️', k: 'snow-capped mountain' }, { c: '🗻', k: 'mount fuji' }, { c: '🏕️', k: 'camping' }, 
            { c: '⛺', k: 'tent' }, { c: '🛖', k: 'hut' }, { c: '🏠', k: 'house' }, 
            { c: '🏡', k: 'house with garden' }, { c: '🏘️', k: 'houses' }, { c: '🏚️', k: 'derelict house' }, 
            { c: '🏗️', k: 'building construction' }, { c: '🏭', k: 'factory' }, { c: '🏢', k: 'office building' }, 
            { c: '🏬', k: 'department store' }, { c: '🏣', k: 'japanese post office' }, { c: '🏤', k: 'post office' }, 
            { c: '🏥', k: 'hospital' }, { c: '🏦', k: 'bank' }, { c: '🏨', k: 'hotel' }, 
            { c: '🏪', k: 'convenience store' }, { c: '🏫', k: 'school' }, { c: '🏩', k: 'love hotel' }, 
            { c: '💒', k: 'wedding' }, { c: '🏛️', k: 'classical building museum' }, { c: '⛪', k: 'church' }, 
            { c: '🕌', k: 'mosque' }, { c: '🛕', k: 'hindu temple' }, { c: '🕍', k: 'synagogue' }, 
            { c: '⛩️', k: 'shinto shrine' }, { c: '🕋', k: 'kaaba' }, { c: '🌅', k: 'sunrise' }, 
            { c: '🌄', k: 'sunrise over mountains' }, { c: '🌠', k: 'shooting star' }, { c: '🎇', k: 'sparkler' }, 
            { c: '🎆', k: 'fireworks' }, { c: '🌇', k: 'sunset' }, { c: '🌆', k: 'cityscape at dusk' }, 
            { c: '🏙️', k: 'cityscape' }, { c: '🌃', k: 'night with stars' }, { c: '🌌', k: 'milky way galaxy' }, 
            { c: '🌉', k: 'bridge at night' }, { c: '🌁', k: 'foggy' }
        ]
    },
    {
        id: 'objects', icon: <Lightbulb />, title: 'Предметы',
        items: [
            { c: '⌚', k: 'watch' }, { c: '📱', k: 'mobile phone smartphone' }, { c: '📲', k: 'mobile phone with arrow' }, 
            { c: '💻', k: 'laptop computer pc' }, { c: '⌨️', k: 'keyboard' }, { c: '🖥️', k: 'desktop computer pc' }, 
            { c: '🖨️', k: 'printer' }, { c: '🖱️', k: 'computer mouse' }, { c: '🖲️', k: 'trackball' }, 
            { c: '🕹️', k: 'joystick game' }, { c: '🗜️', k: 'clamp' }, { c: '💽', k: 'computer disk' }, 
            { c: '💾', k: 'floppy disk save' }, { c: '💿', k: 'optical disk cd' }, { c: '📀', k: 'dvd' }, 
            { c: '📼', k: 'videocassette tape' }, { c: '📷', k: 'camera photo' }, { c: '📸', k: 'camera with flash' }, 
            { c: '📹', k: 'video camera' }, { c: '🎥', k: 'movie camera' }, { c: '📽️', k: 'film projector' }, 
            { c: '🎞️', k: 'film frames' }, { c: '📞', k: 'telephone receiver' }, { c: '☎️', k: 'telephone' }, 
            { c: '📟', k: 'pager' }, { c: '📠', k: 'fax machine' }, { c: '📺', k: 'television tv' }, 
            { c: '📻', k: 'radio' }, { c: '🎙️', k: 'studio microphone' }, { c: '🎚️', k: 'level slider' }, 
            { c: '🎛️', k: 'control knobs' }, { c: '🧭', k: 'compass' }, { c: '⏱️', k: 'stopwatch' }, 
            { c: '⏲️', k: 'timer clock' }, { c: '⏰', k: 'alarm clock' }, { c: '🕰️', k: 'mantelpiece clock' }, 
            { c: '⌛', k: 'hourglass done' }, { c: '⏳', k: 'hourglass not done' }, { c: '📡', k: 'satellite antenna' }, 
            { c: '🔋', k: 'battery' }, { c: '🔌', k: 'electric plug' }, { c: '💡', k: 'light bulb idea' }, 
            { c: '🔦', k: 'flashlight' }, { c: '🕯️', k: 'candle' }, { c: '🧯', k: 'fire extinguisher' }, 
            { c: '🛢️', k: 'oil drum' }, { c: '💸', k: 'money with wings cash' }, { c: '💵', k: 'dollar banknote' }, 
            { c: '💴', k: 'yen banknote' }, { c: '💶', k: 'euro banknote' }, { c: '💷', k: 'pound banknote' }, 
            { c: '🪙', k: 'coin' }, { c: '💰', k: 'money bag cash' }, { c: '💳', k: 'credit card' }, 
            { c: '💎', k: 'gem stone diamond' }, { c: '⚖️', k: 'balance scale' }, { c: '🪜', k: 'ladder' }, 
            { c: '🧰', k: 'toolbox' }, { c: '🪛', k: 'screwdriver' }, { c: '🔧', k: 'wrench tool' }, 
            { c: '🔨', k: 'hammer' }, { c: '⚒️', k: 'hammer and pick' }, { c: '🛠️', k: 'hammer and wrench' }, 
            { c: '⛏️', k: 'pick' }, { c: '🪚', k: 'carpentry saw' }, { c: '🔩', k: 'nut and bolt' }, 
            { c: '⚙️', k: 'gear' }, { c: '🪤', k: 'mouse trap' }, { c: '🧱', k: 'brick' }, 
            { c: '⛓️', k: 'chains' }, { c: '🧲', k: 'magnet' }, { c: '🔫', k: 'water pistol gun' }, 
            { c: '💣', k: 'bomb' }, { c: '🧨', k: 'firecracker' }, { c: '🪓', k: 'axe' }, 
            { c: '🔪', k: 'kitchen knife' }, { c: '🗡️', k: 'dagger' }, { c: '⚔️', k: 'crossed swords' }, 
            { c: '🛡️', k: 'shield' }, { c: '🚬', k: 'cigarette smoking' }, { c: '⚰️', k: 'coffin' }, 
            { c: '🪦', k: 'headstone' }, { c: '⚱️', k: 'funeral urn' }, { c: '🏺', k: 'amphora' }, 
            { c: '🔮', k: 'crystal ball magic' }, { c: '📿', k: 'prayer beads' }, { c: '🧿', k: 'nazar amulet' }, 
            { c: '💈', k: 'barber pole' }, { c: '⚗️', k: 'alembic' }, { c: '🔭', k: 'telescope' }, 
            { c: '🔬', k: 'microscope' }, { c: '🕳️', k: 'hole' }, { c: '🩹', k: 'adhesive bandage plaster' }, 
            { c: '🩺', k: 'stethoscope' }, { c: '💊', k: 'pill medicine' }, { c: '💉', k: 'syringe needle blood' }, 
            { c: '🩸', k: 'drop of blood' }, { c: '🧬', k: 'dna' }, { c: '🦠', k: 'microbe virus' }, 
            { c: '🧫', k: 'petri dish' }, { c: '🧪', k: 'test tube' }, { c: '🌡️', k: 'thermometer' }, 
            { c: '🧹', k: 'broom' }, { c: '🧺', k: 'basket' }, { c: '🧻', k: 'roll of paper toilet' }, 
            { c: '🚽', k: 'toilet' }, { c: '🚰', k: 'potable water' }, { c: '🚿', k: 'shower' }, 
            { c: '🛁', k: 'bathtub' }, { c: '🛀', k: 'person taking bath' }, { c: '🧼', k: 'soap' }, 
            { c: '🧽', k: 'sponge' }, { c: '🪒', k: 'razor' }, { c: '🧴', k: 'lotion bottle' }, 
            { c: '🛎️', k: 'bellhop bell' }, { c: '🔑', k: 'key lock' }, { c: '🗝️', k: 'old key' }, 
            { c: '🚪', k: 'door' }, { c: '🪑', k: 'chair' }, { c: '🛋️', k: 'couch and lamp sofa' }, 
            { c: '🛏️', k: 'bed' }, { c: '🛌', k: 'person in bed' }, { c: '🧸', k: 'teddy bear' }, 
            { c: '🪆', k: 'nesting dolls matryoshka' }, { c: '🖼️', k: 'framed picture frame' }, 
            { c: '🪞', k: 'mirror' }, { c: '🪟', k: 'window' }, { c: '🛍️', k: 'shopping bags' }, 
            { c: '🛒', k: 'shopping cart' }, { c: '🎁', k: 'wrapped gift present' }, { c: '🎈', k: 'balloon party' }, 
            { c: '🎏', k: 'carp streamer' }, { c: '🎀', k: 'ribbon bow' }, { c: '🪄', k: 'magic wand' }, 
            { c: '🪅', k: 'piñata' }, { c: '🎊', k: 'confetti ball' }, { c: '🎉', k: 'party popper' }, 
            { c: '🎎', k: 'japanese dolls' }, { c: '🏮', k: 'red paper lantern' }, { c: '🎐', k: 'wind chime' }, 
            { c: '✉️', k: 'envelope mail letter' }, { c: '📩', k: 'envelope with arrow' }, { c: '📨', k: 'incoming envelope' }, 
            { c: '📧', k: 'e-mail' }, { c: '💌', k: 'love letter' }, { c: '📥', k: 'inbox tray' }, 
            { c: '📤', k: 'outbox tray' }, { c: '📦', k: 'package box' }, { c: '🏷️', k: 'label tag' }, 
            { c: '📪', k: 'closed mailbox with lowered flag' }, { c: '📫', k: 'closed mailbox with raised flag' }, 
            { c: '📬', k: 'open mailbox with raised flag' }, { c: '📭', k: 'open mailbox with lowered flag' }, 
            { c: '📮', k: 'postbox' }, { c: '📯', k: 'postal horn' }, { c: '📜', k: 'scroll' }, 
            { c: '📃', k: 'page with curl' }, { c: '📄', k: 'page facing up document' }, { c: '📑', k: 'bookmark tabs' }, 
            { c: '🧾', k: 'receipt bill' }, { c: '📊', k: 'bar chart diagram' }, { c: '📈', k: 'chart increasing trend' }, 
            { c: '📉', k: 'chart decreasing' }, { c: '🗒️', k: 'spiral notepad' }, { c: '🗓️', k: 'spiral calendar' }, 
            { c: '📆', k: 'tear-off calendar' }, { c: '📅', k: 'calendar date' }, { c: '🗑️', k: 'wastebasket trash' }, 
            { c: '📇', k: 'card index' }, { c: '🗃️', k: 'card file box' }, { c: '🗳️', k: 'ballot box with ballot' }, 
            { c: '🗄️', k: 'file cabinet' }, { c: '📋', k: 'clipboard' }, { c: '📁', k: 'file folder' }, 
            { c: '📂', k: 'open file folder' }, { c: '🗂️', k: 'card index dividers' }, { c: '🗞️', k: 'rolled-up newspaper' }, 
            { c: '📰', k: 'newspaper' }, { c: '📓', k: 'notebook' }, { c: '📔', k: 'notebook with decorative cover' }, 
            { c: '📒', k: 'ledger' }, { c: '📕', k: 'closed book red' }, { c: '📗', k: 'green book' }, 
            { c: '📘', k: 'blue book' }, { c: '📙', k: 'orange book' }, { c: '📚', k: 'books' }, 
            { c: '📖', k: 'open book' }, { c: '🔖', k: 'bookmark' }, { c: '🧷', k: 'safety pin' }, 
            { c: '🔗', k: 'link' }, { c: '📎', k: 'paperclip' }, { c: '🖇️', k: 'linked paperclips' }, 
            { c: '📐', k: 'triangular ruler' }, { c: '📏', k: 'straight ruler' }, { c: '🧮', k: 'abacus' }, 
            { c: '📌', k: 'pushpin' }, { c: '📍', k: 'round pushpin location' }, { c: '✂️', k: 'scissors' }, 
            { c: '🖊️', k: 'pen' }, { c: '🖋️', k: 'fountain pen' }, { c: '✒️', k: 'black nib' }, 
            { c: '🖌️', k: 'paintbrush' }, { c: '🖍️', k: 'crayon' }, { c: '📝', k: 'memo pencil' }, 
            { c: '✏️', k: 'pencil' }, { c: '🔍', k: 'magnifying glass left search' }, { c: '🔎', k: 'magnifying glass right' }, 
            { c: '🔏', k: 'locked with pen' }, { c: '🔐', k: 'locked with key' }, { c: '🔒', k: 'locked closed' }, 
            { c: '🔓', k: 'unlocked open' }
        ]
    },
    {
        id: 'symbols', icon: <Hashtag />, title: 'Символы',
        items: [
            { c: '❤️', k: 'heart red love' }, { c: '🧡', k: 'heart orange' }, { c: '💛', k: 'heart yellow' },
            { c: '💚', k: 'heart green' }, { c: '💙', k: 'heart blue' }, { c: '💜', k: 'heart purple' },
            { c: '🖤', k: 'heart black' }, { c: '🤍', k: 'heart white' }, { c: '🤎', k: 'heart brown' },
            { c: '💔', k: 'heart broken' }, { c: '❣️', k: 'heart exclaim' }, { c: '💕', k: 'heart two' },
            { c: '💞', k: 'heart revolving' }, { c: '💓', k: 'heart beating' }, { c: '💗', k: 'heart growing' },
            { c: '💖', k: 'heart sparkle' }, { c: '💘', k: 'heart arrow' }, { c: '💝', k: 'heart ribbon' },
            { c: '☮️', k: 'peace sign' }, { c: '✝️', k: 'latin cross' }, { c: '☪️', k: 'star and crescent islam' }, 
            { c: '🕉️', k: 'om hinduism' }, { c: '☸️', k: 'wheel of dharma buddhism' }, { c: '✡️', k: 'star of david judaism' }, 
            { c: '🔯', k: 'six pointed star' }, { c: '🕎', k: 'menorah' }, { c: '☯️', k: 'yin yang' }, 
            { c: '☦️', k: 'orthodox cross' }, { c: '🛐', k: 'place of worship' }, { c: '⛎', k: 'ophiuchus' },
            { c: '♈', k: 'aries zodiac' }, { c: '♉', k: 'taurus zodiac' }, { c: '♊', k: 'gemini zodiac' },
            { c: '♋', k: 'cancer zodiac' }, { c: '♌', k: 'leo zodiac' }, { c: '♍', k: 'virgo zodiac' },
            { c: '♎', k: 'libra zodiac' }, { c: '♏', k: 'scorpio zodiac' }, { c: '♐', k: 'sagittarius zodiac' },
            { c: '♑', k: 'capricorn zodiac' }, { c: '♒', k: 'aquarius zodiac' }, { c: '♓', k: 'pisces zodiac' },
            { c: '🆔', k: 'id' }, { c: '⚛️', k: 'atom symbol' }, { c: '🉑', k: 'accept' },
            { c: '☢️', k: 'radioactive' }, { c: '☣️', k: 'biohazard' }, { c: '📴', k: 'mobile off' },
            { c: '📳', k: 'vibration mode' }, { c: '🈶', k: 'have' }, { c: '🈚', k: 'none' },
            { c: '🈸', k: 'application' }, { c: '🈺', k: 'open sign' }, { c: '🈷️', k: 'monthly' },
            { c: '✴️', k: 'eight pointed star' }, { c: '🆚', k: 'vs versus' }, { c: '💮', k: 'white flower stamp' },
            { c: '🉐', k: 'bargain' }, { c: '㊙️', k: 'secret' }, { c: '㊗️', k: 'congrats' },
            { c: '🈴', k: 'passing grade' }, { c: '🈵', k: 'full capacity' }, { c: '🈹', k: 'discount' }, 
            { c: '🈲', k: 'prohibited' }, { c: '🅰️', k: 'a blood type' }, { c: '🅱️', k: 'b blood type' }, 
            { c: '🆎', k: 'ab blood type' }, { c: '🅾️', k: 'o blood type' }, { c: '🛑', k: 'stop sign' }, 
            { c: '⛔', k: 'no entry sign' }, { c: '📛', k: 'name badge' }, { c: '🚫', k: 'prohibited ban' }, 
            { c: '🔞', k: 'no one under 18 eighteen' }, { c: '📵', k: 'no mobile phones' }, { c: '🚷', k: 'no pedestrians' }, 
            { c: '🚯', k: 'no littering trash' }, { c: '🚳', k: 'no bicycles' }, { c: '🚱', k: 'non-potable water' }, 
            { c: '❗️', k: 'red exclamation mark' }, { c: '❕', k: 'white exclamation mark' }, { c: '❓', k: 'red question mark' },
            { c: '❔', k: 'white question mark' }, { c: '‼️', k: 'double exclamation mark' }, { c: '⁉️', k: 'interrobang question exclamation' },
            { c: '🔅', k: 'dim button' }, { c: '🔆', k: 'bright button' }, { c: '〽️', k: 'part alternation mark' },
            { c: '⚠️', k: 'warning sign triangle' }, { c: '🚸', k: 'children crossing' }, { c: '🔱', k: 'trident emblem' },
            { c: '⚜️', k: 'fleur de lis' }, { c: '🔰', k: 'japanese symbol for beginner' }, { c: '♻️', k: 'recycling symbol' },
            { c: '✅', k: 'check mark button true yes ok' }, { c: '🈯', k: 'reserved' }, { c: '💹', k: 'chart increasing with yen' },
            { c: '❇️', k: 'sparkle' }, { c: '✳️', k: 'eight spoked asterisk' }, { c: '❎', k: 'cross mark button false no' },
            { c: '🌐', k: 'globe with meridians internet' }, { c: '💠', k: 'diamond with a dot' }, { c: 'Ⓜ️', k: 'm metro' },
            { c: '🌀', k: 'cyclone' }, { c: '💤', k: 'zzz sleep' }, { c: '🏧', k: 'atm sign money' },
            { c: '🚾', k: 'water closet wc toilet' }, { c: '♿', k: 'wheelchair symbol disability' }, { c: '🅿️', k: 'parking symbol' },
            { c: '🈳', k: 'vacancy empty' }, { c: '🈂️', k: 'service charge' }, { c: '🛂', k: 'passport control' }, 
            { c: '🛃', k: 'customs' }, { c: '🛄', k: 'baggage claim' }, { c: '🛅', k: 'left luggage' }, 
            { c: '🚹', k: 'men room' }, { c: '🚺', k: 'women room' }, { c: '🚼', k: 'baby symbol' }, 
            { c: '🚻', k: 'restroom' }, { c: '🚮', k: 'litter in bin sign' }, { c: '🎦', k: 'cinema' }, 
            { c: '📶', k: 'antenna bars signal wifi' }, { c: '🈁', k: 'here' }, { c: '🔣', k: 'input symbols' }, 
            { c: 'ℹ️', k: 'information info' }, { c: '🔤', k: 'input latin letters' }, { c: '🔡', k: 'input latin lowercase' }, 
            { c: '🔠', k: 'input latin uppercase' }, { c: '🆖', k: 'ng button' }, { c: '🆗', k: 'ok button yes' }, 
            { c: '🆙', k: 'up button' }, { c: '🆒', k: 'cool button' }, { c: '🆕', k: 'new button' }, 
            { c: '🆓', k: 'free button' }, { c: '0️⃣', k: 'keycap digit zero' }, { c: '1️⃣', k: 'keycap digit one' }, 
            { c: '2️⃣', k: 'keycap digit two' }, { c: '3️⃣', k: 'keycap digit three' }, { c: '4️⃣', k: 'keycap digit four' }, 
            { c: '5️⃣', k: 'keycap digit five' }, { c: '6️⃣', k: 'keycap digit six' }, { c: '7️⃣', k: 'keycap digit seven' }, 
            { c: '8️⃣', k: 'keycap digit eight' }, { c: '9️⃣', k: 'keycap digit nine' }, { c: '🔟', k: 'keycap ten' }, 
            { c: '🔢', k: 'input numbers' }, { c: '#️⃣', k: 'keycap number sign hashtag' }, { c: '*️⃣', k: 'keycap asterisk' }, 
            { c: '⏏️', k: 'eject button' }, { c: '▶️', k: 'play button' }, { c: '⏸️', k: 'pause button' }, 
            { c: '⏯️', k: 'play or pause button' }, { c: '⏹️', k: 'stop button' }, { c: '⏺️', k: 'record button' }, 
            { c: '⏭️', k: 'next track button' }, { c: '⏮️', k: 'previous track button' }, { c: '⏩', k: 'fast-forward button' }, 
            { c: '⏪', k: 'fast reverse button' }, { c: '⏫', k: 'fast up button' }, { c: '⏬', k: 'fast down button' }, 
            { c: '◀️', k: 'reverse play button' }, { c: '🔼', k: 'upwards button arrow' }, { c: '🔽', k: 'downwards button arrow' }, 
            { c: '➡️', k: 'right arrow' }, { c: '⬅️', k: 'left arrow' }, { c: '⬆️', k: 'up arrow' }, 
            { c: '⬇️', k: 'down arrow' }, { c: '↗️', k: 'up-right arrow' }, { c: '↘️', k: 'down-right arrow' }, 
            { c: '↙️', k: 'down-left arrow' }, { c: '↖️', k: 'up-left arrow' }, { c: '↕️', k: 'up-down arrow' }, 
            { c: '↔️', k: 'left-right arrow' }, { c: '↪️', k: 'right arrow curving left' }, { c: '↩️', k: 'left arrow curving right' }, 
            { c: '⤴️', k: 'right arrow curving up' }, { c: '⤵️', k: 'right arrow curving down' }, { c: '🔀', k: 'shuffle tracks button' }, 
            { c: '🔁', k: 'repeat button' }, { c: '🔂', k: 'repeat single button' }, { c: '🔄', k: 'counterclockwise arrows button refresh' }, 
            { c: '🔃', k: 'clockwise vertical arrows' }, { c: '🎵', k: 'musical note' }, { c: '🎶', k: 'musical notes' }, 
            { c: '➕', k: 'plus sign math' }, { c: '➖', k: 'minus sign math' }, { c: '➗', k: 'divide sign math' }, 
            { c: '✖️', k: 'multiply sign math cross' }, { c: '♾️', k: 'infinity' }, { c: '💲', k: 'heavy dollar sign money' }, 
            { c: '💱', k: 'currency exchange' }, { c: '™️', k: 'trade mark' }, { c: '©️', k: 'copyright' }, 
            { c: '®️', k: 'registered' }, { c: '〰️', k: 'wavy dash' }, { c: '➰', k: 'curly loop' }, 
            { c: '➿', k: 'double curly loop' }, { c: '❌', k: 'cross mark x false no' }, { c: '💯', k: 'hundred points score perfect' },
            { c: '🔴', k: 'red circle shape' }, { c: '🟠', k: 'orange circle shape' }, { c: '🟡', k: 'yellow circle shape' }, 
            { c: '🟢', k: 'green circle shape' }, { c: '🔵', k: 'blue circle shape' }, { c: '🟣', k: 'purple circle shape' }, 
            { c: '🟤', k: 'brown circle shape' }, { c: '⚫', k: 'black circle shape' }, { c: '⚪', k: 'white circle shape' }, 
            { c: '🟥', k: 'red square shape' }, { c: '🟧', k: 'orange square shape' }, { c: '🟨', k: 'yellow square shape' }, 
            { c: '🟩', k: 'green square shape' }, { c: '🟦', k: 'blue square shape' }, { c: '🟪', k: 'purple square shape' }, 
            { c: '🟫', k: 'brown square shape' }, { c: '⬛', k: 'black large square' }, { c: '⬜', k: 'white large square' }, 
            { c: '◼️', k: 'black medium square' }, { c: '◻️', k: 'white medium square' }, { c: '◾', k: 'black medium-small square' }, 
            { c: '◽', k: 'white medium-small square' }, { c: '▪️', k: 'black small square' }, { c: '▫️', k: 'white small square' }, 
            { c: '🔶', k: 'large orange diamond' }, { c: '🔷', k: 'large blue diamond' }, { c: '🔸', k: 'small orange diamond' }, 
            { c: '🔹', k: 'small blue diamond' }, { c: '🔺', k: 'red triangle pointed up' }, { c: '🔻', k: 'red triangle pointed down' }, 
            { c: '💠', k: 'diamond with a dot' }, { c: '🔘', k: 'radio button' }, { c: '🔳', k: 'white square button' }, 
            { c: '🔲', k: 'black square button' }
        ]
    },
    {
        id: 'flags', icon: <Flag />, title: 'Флаги',
        items: [
            { c: '🏁', k: 'checkered flag racing' }, { c: '🚩', k: 'triangular flag on post' }, { c: '🎌', k: 'crossed flags japan' },
            { c: '🏴', k: 'black flag' }, { c: '🏳️', k: 'white flag' }, { c: '🏳️‍🌈', k: 'rainbow flag lgbt pride' },
            { c: '🏳️‍⚧️', k: 'transgender flag' }, { c: '🏴‍☠️', k: 'pirate flag skull' }, { c: '🇺🇳', k: 'united nations un' },
            { c: '🇦🇫', k: 'afghanistan' }, { c: '🇦🇱', k: 'albania' }, { c: '🇩🇿', k: 'algeria' },
            { c: '🇦🇲', k: 'armenia' }, { c: '🇦🇺', k: 'australia' }, { c: '🇦🇹', k: 'austria' }, 
            { c: '🇦🇿', k: 'azerbaijan' }, { c: '🇧🇾', k: 'belarus' }, { c: '🇧🇪', k: 'belgium' },
            { c: '🇧🇦', k: 'bosnia and herzegovina' }, { c: '🇧🇷', k: 'brazil' }, { c: '🇧🇬', k: 'bulgaria' }, 
            { c: '🇨🇦', k: 'canada' }, { c: '🇨🇳', k: 'china' }, { c: '🇨🇴', k: 'colombia' }, 
            { c: '🇭🇷', k: 'croatia' }, { c: '🇨🇾', k: 'cyprus' }, { c: '🇨🇿', k: 'czechia czech republic' }, 
            { c: '🇩🇰', k: 'denmark' }, { c: '🇪🇪', k: 'estonia' }, { c: '🇪🇬', k: 'egypt' },
            { c: '🇫🇮', k: 'finland' }, { c: '🇫🇷', k: 'france' }, { c: '🇬🇪', k: 'georgia' }, 
            { c: '🇩🇪', k: 'germany' }, { c: '🇬🇷', k: 'greece' }, { c: '🇭🇺', k: 'hungary' }, 
            { c: '🇮🇳', k: 'india' }, { c: '🇮🇩', k: 'indonesia' }, { c: '🇮🇪', k: 'ireland' }, 
            { c: '🇮🇱', k: 'israel' }, { c: '🇮🇹', k: 'italy' }, { c: '🇯🇵', k: 'japan' }, 
            { c: '🇰🇿', k: 'kazakhstan' }, { c: '🇰🇷', k: 'south korea' }, { c: '🇰🇬', k: 'kyrgyzstan' }, 
            { c: '🇱🇻', k: 'latvia' }, { c: '🇱🇹', k: 'lithuania' }, { c: '🇲🇽', k: 'mexico' },
            { c: '🇲🇩', k: 'moldova' }, { c: '🇲🇪', k: 'montenegro' }, { c: '🇳🇱', k: 'netherlands' }, 
            { c: '🇳🇿', k: 'new zealand' }, { c: '🇲🇰', k: 'north macedonia' }, { c: '🇳🇴', k: 'norway' },
            { c: '🇵🇱', k: 'poland' }, { c: '🇵🇹', k: 'portugal' }, { c: '🇷🇴', k: 'romania' }, 
            { c: '🇷🇺', k: 'russia' }, { c: '🇸🇦', k: 'saudi arabia' }, { c: '🇷🇸', k: 'serbia' }, 
            { c: '🇸🇰', k: 'slovakia' }, { c: '🇸🇮', k: 'slovenia' }, { c: '🇪🇸', k: 'spain' }, 
            { c: '🇸🇪', k: 'sweden' }, { c: '🇨🇭', k: 'switzerland' }, { c: '🇹🇯', k: 'tajikistan' }, 
            { c: '🇹🇷', k: 'turkey' }, { c: '🇹🇲', k: 'turkmenistan' }, { c: '🇺🇦', k: 'ukraine' },
            { c: '🇬🇧', k: 'uk united kingdom great britain england' }, { c: '🇺🇸', k: 'usa united states america' }, { c: '🇺🇿', k: 'uzbekistan' }
        ]
    }
];

export default function EmojiPicker({ onSelect, onClose, position = 'bottom-start' }) {
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeCategory, setActiveCategory] = useState('recent');
    const [hoveredEmoji, setHoveredEmoji] = useState(null);
    const [recent, setRecent] = useState(() => {
        try {
            return JSON.parse(localStorage.getItem('itd_recent_emojis') || '[]');
        } catch { return []; }
    });
    
    const scrollRef = useRef(null);
    const pickerRef = useRef(null);
    const categoryRefs = useRef({});
    const observer = useRef(null);

    
    useEffect(() => {
        const timer = setTimeout(() => setDebouncedSearch(search), 150);
        return () => clearTimeout(timer);
    }, [search]);

    
    const addToRecent = (emoji) => {
        const newRecent = [emoji, ...recent.filter(e => e.c !== emoji.c)].slice(0, 36); 
        setRecent(newRecent);
        localStorage.setItem('itd_recent_emojis', JSON.stringify(newRecent));
    };

    const clearRecent = () => {
        setRecent([]);
        localStorage.removeItem('itd_recent_emojis');
    };

    const handleEmojiClick = useCallback((emojiObj) => {
        addToRecent(emojiObj);
        onSelect(emojiObj.c);
    }, [onSelect, recent]);

    
    const filteredResults = useMemo(() => {
        if (!debouncedSearch.trim()) return null;
        
        let q = debouncedSearch.toLowerCase().trim();
        
        
        
        const matchedEnKeys = new Set();
        Object.keys(RU_TO_EN_MAP).forEach(ruWord => {
            
            if (ruWord.includes(q) || q.includes(ruWord)) {
                matchedEnKeys.add(RU_TO_EN_MAP[ruWord]);
            }
        });

        
        const results = [];
        EMOJI_DATA.forEach(cat => {
            const categoryMatch = cat.title.toLowerCase().includes(q);
            
            cat.items.forEach(emoji => {
                
                const enKeyMatch = emoji.k.includes(q);
                
                
                let ruKeyMatch = false;
                for (const enKey of matchedEnKeys) {
                    if (emoji.k.includes(enKey)) {
                        ruKeyMatch = true;
                        break;
                    }
                }
                
                
                if (enKeyMatch || ruKeyMatch || categoryMatch) {
                    results.push(emoji);
                }
            });
        });
        
        
        return Array.from(new Set(results));
    }, [debouncedSearch]);

    
    const scrollToCategory = (catId) => {
        if (catId === 'recent') {
            scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
            return;
        }
        const el = categoryRefs.current[catId];
        if (el && scrollRef.current) {
            const top = el.offsetTop - 54; 
            scrollRef.current.scrollTo({ top, behavior: 'smooth' });
        }
    };

    
    useEffect(() => {
        if (debouncedSearch) return;

        const options = {
            root: scrollRef.current,
            rootMargin: '-50px 0px -80% 0px',
            threshold: 0
        };

        const callback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveCategory(entry.target.dataset.id);
                }
            });
        };

        observer.current = new IntersectionObserver(callback, options);

        Object.values(categoryRefs.current).forEach(el => {
            if (el) observer.current.observe(el);
        });
        
        const recentEl = categoryRefs.current['recent'];
        if (recentEl) observer.current.observe(recentEl);

        return () => observer.current?.disconnect();
    }, [debouncedSearch, recent.length]);

    
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target)) {
                onClose?.();
            }
        };
        document.addEventListener('pointerdown', handleClickOutside);
        return () => document.removeEventListener('pointerdown', handleClickOutside);
    }, [onClose]);

    
    const handleEmojiHover = useCallback((emoji) => {
        setHoveredEmoji(emoji);
    }, []);

    
    const getPreviewName = (k) => {
        if (!k) return '';
        
        const firstWord = k.split(' ')[0];
        return firstWord.charAt(0).toUpperCase() + firstWord.slice(1);
    };

    return (
        <div 
            className={`emoji-picker-root pos-${position}`} 
            ref={pickerRef}
            onClick={e => e.stopPropagation()}
            onPointerDown={e => e.stopPropagation()}
        >
            {}
            <div className="emoji-header">
                <div className="emoji-search-wrapper">
                    <Magnifer size={16} className="emoji-search-icon" />
                    <input 
                        type="text" 
                        placeholder="Поиск (кот, любовь, авто...)" 
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="emoji-search-input"
                        autoFocus
                    />
                    {search && (
                        <button className="emoji-search-clear" onClick={() => setSearch('')}>
                            <CloseCircle size={16} variant="Bold" />
                        </button>
                    )}
                </div>
            </div>

            {}
            <div className="emoji-scroll-content custom-scrollbar" ref={scrollRef}>
                {debouncedSearch ? (
                    <div className="emoji-section">
                        <div className="emoji-category-title sticky">Результаты поиска</div>
                        <div className="emoji-grid">
                            {filteredResults.length > 0 ? filteredResults.map((emoji, idx) => (
                                <EmojiButton 
                                    key={`search-${idx}`} 
                                    emoji={emoji} 
                                    onClick={handleEmojiClick}
                                    onHover={handleEmojiHover}
                                />
                            )) : (
                                <div className="emoji-no-results">
                                    <span style={{fontSize: '48px', marginBottom: '8px'}}>🕵️‍♀️</span>
                                    <span>Ничего не найдено</span>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    <>
                        {recent.length > 0 && (
                            <div 
                                className="emoji-section" 
                                data-id="recent"
                                ref={el => categoryRefs.current['recent'] = el}
                            >
                                <div className="emoji-category-title sticky">
                                    <span>Недавние</span>
                                    <button 
                                        className="emoji-clear-recent" 
                                        onClick={clearRecent} 
                                        title="Очистить историю"
                                    >
                                        <TrashBinTrash size={14} />
                                    </button>
                                </div>
                                <div className="emoji-grid">
                                    {recent.map((emoji, idx) => (
                                        <EmojiButton 
                                            key={`recent-${idx}`} 
                                            emoji={emoji} 
                                            onClick={handleEmojiClick}
                                            onHover={handleEmojiHover}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {EMOJI_DATA.map(cat => (
                            <div 
                                key={cat.id} 
                                className="emoji-section"
                                data-id={cat.id}
                                ref={el => categoryRefs.current[cat.id] = el}
                            >
                                <div className="emoji-category-title sticky">{cat.title}</div>
                                <div className="emoji-grid">
                                    {cat.items.map((emoji, idx) => (
                                        <EmojiButton 
                                            key={`${cat.id}-${idx}`} 
                                            emoji={emoji} 
                                            onClick={handleEmojiClick}
                                            onHover={handleEmojiHover}
                                        />
                                    ))}
                                </div>
                            </div>
                        ))}
                    </>
                )}
                {}
                <div style={{ height: '50px' }}></div>
            </div>
            
            {}
            <div className="emoji-preview-bar">
                <div className="emoji-preview-content">
                    {hoveredEmoji ? (
                        <>
                            <div className="ep-preview-icon">{hoveredEmoji.c}</div>
                            <div className="ep-preview-info">
                                <span className="ep-preview-name">
                                    {getPreviewName(hoveredEmoji.k)}
                                </span>
                                <span className="ep-preview-keywords">:{hoveredEmoji.k.split(' ')[0]}:</span>
                            </div>
                        </>
                    ) : (
                        <span className="ep-preview-placeholder">Выберите эмодзи</span>
                    )}
                </div>
            </div>

            {}
            <div className="emoji-tabs-footer">
                <TabButton 
                    active={activeCategory === 'recent'} 
                    onClick={() => scrollToCategory('recent')} 
                    icon={<ClockCircle size={20} />} 
                    title="Недавние"
                />
                
                {EMOJI_DATA.map(cat => (
                    <TabButton 
                        key={cat.id}
                        active={activeCategory === cat.id}
                        onClick={() => scrollToCategory(cat.id)}
                        icon={React.cloneElement(cat.icon, { size: 20 })}
                        title={cat.title}
                    />
                ))}
            </div>
        </div>
    );
}


const EmojiButton = React.memo(({ emoji, onClick, onHover }) => (
    <button 
        className="emoji-btn" 
        onClick={() => onClick(emoji)}
        onMouseEnter={() => onHover(emoji)}
        type="button"
    >
        {emoji.c}
    </button>
));

const TabButton = React.memo(({ active, onClick, icon, title }) => (
    <button 
        className={`emoji-tab ${active ? 'active' : ''}`}
        onClick={onClick}
        title={title}
        type="button"
    >
        {icon}
        {active && <span className="emoji-tab-indicator" />}
    </button>
));