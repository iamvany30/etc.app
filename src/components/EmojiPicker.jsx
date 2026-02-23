import React, { useState, useRef, useEffect, useMemo } from 'react';
import '../styles/EmojiPicker.css';

const EMOJI_CATEGORIES = [
    {
        id: 'smileys', icon: '😀', title: 'Смайлы',
        emojis: ['😀','😃','😄','😁','😆','😅','😂','🤣','🥲','☺️','😊','😇','🙂','🙃','😉','😌','😍','🥰','😘','😗','😙','😚','😋','😛','😝','😜','🤪','🤨','🧐','🤓','😎','🥸','🤩','🥳','😏','😒','😞','😔','😟','😕','🙁','☹️','😣','😖','😫','😩','🥺','😢','😭','😤','😠','😡','🤬','🤯','😳','🥵','🥶','😱','😨','😰','😥','😓','🤗','🤔','🤭','🤫','🤥','😶','😐','😑','😬','🙄','😯','😦','😧','😮','😲','🥱','😴','🤤','😪','😵','🤐','🥴','🤢','🤮','🤧','😷','🤒','🤕','🤑','🤠','😈','👿','👹','👺','🤡','💩','👻','💀','👽','👾','🤖','🎃']
    },
    {
        id: 'gestures', icon: '👍', title: 'Жесты и люди',
        emojis: ['👋','🤚','🖐','✋','🖖','👌','🤌','🤏','✌️','🤞','🤟','🤘','🤙','👈','👉','👆','🖕','👇','☝️','👍','👎','✊','👊','🤛','🤜','👏','🙌','👐','🤲','🤝','🙏','✍️','💅','🤳','💪','🦾','🦿','🦵','🦶','👂','🦻','👃','🧠','🫀','🫁','🦷','🦴','👀','👁','👅','👄','💋','🩸']
    },
    {
        id: 'hearts', icon: '❤️', title: 'Символы',
        emojis: ['💘','💝','💖','💗','💓','💞','💕','❣️','💔','❤️','🧡','💛','💚','💙','💜','🤎','🖤','🤍','💯','💢','💬','👁️‍🗨️','🗨️','🗯️','💭','💤','💮','♨️','🛑','🕛','❗️','❕','❓','❔','⚠️','🚸','🔥','✨','🌟','💫','💥','⭐','💦','💨']
    },
    {
        id: 'nature', icon: '🌿', title: 'Природа и животные',
        emojis: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐻‍❄️','🐨','🐯','🦁','🐮','🐷','🐽','🐸','🐵','🙈','🙉','🙊','🐒','🐔','🐧','🐦','🐤','🐣','🐥','🦆','🦅','🦉','🦇','🐺','🐗','🐴','🦄','🐝','🪱','🐛','🦋','🐌','🐞','🐜','🪰','🪲','🪳','🦟','🦗','🕷','🕸','🦂','🐢','🐍','🦎','🦖','🦕','🐙','🦑','🦐','🦞','🦀','🐡','🐠','🐟','🐬','🐳','🐋','🦈','🦭','🐊','🐅','🐆','🦓','🦍','🦧','🐘','🦛','🦏','🐪','🐫','🦒','🦘','🐃','🐂','🐄','🐎','🐖','🐏','🐑','🦙','🐐','🦌','🐕','🐩','🦮','🐕‍🦺','🐈','🐈‍⬛','🪶','🐓','🦃','🦤','🦚','🦜','🦢','🦩','🕊','🐇','🦝','🦨','🦡','🦫','🦦','🦥','🐁','🐀','🐿','🦔','🐾','🐉','🐲','🌵','🎄','🌲','🌳','🌴','🪵','🌱','🌿','☘️','🍀','🎍','🪴','🎋','🍃','🍂','🍁','🍄','🐚','🪨','🌾','💐','🌷','🌹','🥀','🌺','🌸','🌼','🌻','🌞','🌝','🌛','🌜','🌚','🌕','🌖','🌗','🌘','🌒','🌓','🌔','🌙','🌎','🌍','🌏','🪐','💫','⭐️','🌟','✨','⚡️','☄️','🌠','🌌','☁️','⛅️','⛈','🌤','🌥','🌦','🌧','🌨','🌩','🌪','🌫','🌬','🌀','🌈','🌂','☂️','☔️','⛱','⚡️','❄️','☃️','⛄️','☄️','🔥','💧','🌊']
    },
    {
        id: 'food', icon: '🍔', title: 'Еда и напитки',
        emojis: ['🍏','🍎','🍐','🍊','🍋','🍌','🍉','🍇','🍓','🍈','🍒','🍑','🥭','🍍','🥥','🥝','🍅','🍆','🥑','🥦','🫒','🥬','🥒','🌶','🫑','🌽','🥕','🧄','🧅','🥔','🍠','🥐','🥯','🍞','🥖','🥨','🧀','🥚','🍳','🧈','🥞','🧇','🥓','🥩','🍗','🍖','🦴','🌭','🍔','🍟','🍕','🫓','🥪','🥙','🧆','🌮','🌯','🫔','🥗','🥘','🫕','🥫','🍝','🍜','🍲','🍛','🍣','🍱','🥟','🦪','🍤','🍙','🍚','🍘','🍥','🥠','🥮','🍢','🍡','🍧','🍨','🍦','🥧','🧁','🍰','🎂','🍮','🍭','🍬','🍫','🍿','🍩','🍪','🌰','🥜','🍯','🥛','🍼','🫖','☕️','🍵','🧃','🥤','🧋','🍶','🍺','🍻','🥂','🍷','🥃','🍸','🍹','🧉','🍾','🧊','🥄','🍴','🍽','🥣','🥡','🥢','🧂']
    }
];

export default function EmojiPicker({ onSelect, onClose, position = 'top' }) {
    
    const [activeTab, setActiveTab] = useState(() => 
        localStorage.getItem('last-emoji-tab') || EMOJI_CATEGORIES[0].id
    );
    
    const pickerRef = useRef(null);

    
    useEffect(() => {
        localStorage.setItem('last-emoji-tab', activeTab);
    }, [activeTab]);

    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (pickerRef.current && !pickerRef.current.contains(event.target)) {
                onClose?.();
            }
        };

        
        document.addEventListener('pointerdown', handleClickOutside);
        return () => document.removeEventListener('pointerdown', handleClickOutside);
    }, [onClose]);

    
    const activeEmojis = useMemo(() => {
        return EMOJI_CATEGORIES.find(c => c.id === activeTab)?.emojis || [];
    }, [activeTab]);

    return (
        <div 
            className={`emoji-picker-container pos-${position}`} 
            ref={pickerRef} 
            
            onPointerDown={e => e.stopPropagation()}
            onClick={e => e.stopPropagation()}
            role="dialog"
            aria-label="Выбор эмодзи"
        >
            <div className="emoji-picker-tabs" role="tablist">
                {EMOJI_CATEGORIES.map(cat => (
                    <button 
                        key={cat.id}
                        type="button"
                        role="tab"
                        aria-selected={activeTab === cat.id}
                        aria-label={cat.title}
                        className={`emoji-tab-btn ${activeTab === cat.id ? 'active' : ''}`}
                        onClick={(e) => {
                            e.preventDefault();
                            setActiveTab(cat.id);
                        }}
                        title={cat.title}
                    >
                        {cat.icon}
                    </button>
                ))}
            </div>
            
            <div className="emoji-picker-content custom-scrollbar" role="tabpanel">
                <div className="emoji-grid">
                    {activeEmojis.map((emoji, idx) => (
                        <button 
                            key={`${activeTab}-${idx}`}
                            type="button"  
                            className="emoji-item-btn"
                            onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                onSelect(emoji);
                            }}
                            aria-label={`Вставить эмодзи ${emoji}`}
                        >
                            <span aria-hidden="true">{emoji}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}