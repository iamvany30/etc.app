
import React from 'react';
import { useUser } from '../../../context/UserContext';
import { useModal } from '../../../context/ModalContext';
import { useNavigate } from 'react-router-dom';
import { IconCheck } from '../../icons/SettingsIcons';
import { IconTrash } from '../../icons/ThemeIcons'; 

const AccountsSettings = ({ setStatus }) => {
    const { accounts, currentUser, switchAccount, logoutAccount } = useUser();
    const { closeModal } = useModal();
    const navigate = useNavigate();

    const handleAddAccount = () => {
        closeModal();
        navigate('/login');
    };

    const handleSwitch = async (accountId) => {
        if (accountId === currentUser.id) return;
        try {
            await switchAccount(accountId);
            closeModal();
        } catch (e) {
            setStatus({ type: 'error', msg: 'Не удалось переключить аккаунт' });
        }
    };

    const handleRemove = async (e, accountId) => {
        e.stopPropagation();
        if (window.confirm('Удалить этот аккаунт с устройства?')) {
            await logoutAccount(accountId);
            setStatus({ type: 'success', msg: 'Аккаунт удален' });
        }
    };

    
    const otherAccounts = Array.isArray(accounts) 
        ? accounts.filter(acc => acc.id !== currentUser.id) 
        : [];

    return (
        <div className="settings-content">
            <div className="settings-section-title">Текущий сеанс</div>
            
            <div className="account-card active">
                <div className="account-card-left">
                    <div className="avatar" style={{width: 48, height: 48, fontSize: 20}}>
                        {currentUser.avatar || "👤"}
                    </div>
                    <div className="account-card-info">
                        <span className="acc-name">{currentUser.displayName}</span>
                        <span className="acc-handle">@{currentUser.username}</span>
                    </div>
                </div>
                <div className="active-badge">
                    <IconCheck />
                </div>
            </div>

            <div className="settings-section-title">Другие аккаунты</div>
            
            <div className="accounts-list-settings">
                {otherAccounts.map(acc => (
                    <div 
                        key={acc.id} 
                        className="account-card clickable"
                        onClick={() => handleSwitch(acc.id)}
                    >
                        <div className="account-card-left">
                            <div className="avatar" style={{width: 40, height: 40, fontSize: 18}}>
                                {acc.avatar || "👤"}
                            </div>
                            <div className="account-card-info">
                                <span className="acc-name">{acc.displayName}</span>
                                <span className="acc-handle">@{acc.username}</span>
                            </div>
                        </div>
                        <button 
                            className="account-remove-btn"
                            onClick={(e) => handleRemove(e, acc.id)}
                            title="Выйти из аккаунта"
                        >
                            <IconTrash />
                        </button>
                    </div>
                ))}

                {otherAccounts.length === 0 && (
                    <div style={{ padding: '0 24px', color: 'var(--color-text-secondary)', fontSize: '13px' }}>
                        Нет других добавленных аккаунтов.
                    </div>
                )}
            </div>

            <div style={{ padding: '20px 24px' }}>
                <button className="settings-save-btn secondary" onClick={handleAddAccount}>
                    + Добавить аккаунт
                </button>
            </div>

            <style>{`
                .account-card {
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                    padding: 12px 24px;
                    margin-bottom: 8px;
                    transition: background 0.2s;
                    border-radius: 12px;
                    margin: 0 12px 8px;
                }
                .account-card.active {
                    background: rgba(var(--color-primary-rgb), 0.1);
                    border: 1px solid var(--color-primary);
                }
                .account-card.clickable {
                    cursor: pointer;
                    background: var(--color-item-bg);
                    border: 1px solid var(--color-border);
                }
                .account-card.clickable:hover {
                    background: rgba(255, 255, 255, 0.05);
                    border-color: var(--color-text-secondary);
                }
                .account-card-left {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                }
                .account-card-info {
                    display: flex;
                    flex-direction: column;
                }
                .acc-name { font-weight: 700; color: var(--color-text); }
                .acc-handle { font-size: 13px; color: var(--color-text-secondary); }
                
                .active-badge { color: var(--color-primary); }
                
                .account-remove-btn {
                    width: 36px;
                    height: 36px;
                    border-radius: 50%;
                    border: 1px solid var(--color-border);
                    background: transparent;
                    color: var(--color-text-secondary);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .account-remove-btn:hover {
                    color: #f4212e;
                    border-color: #f4212e;
                    background: rgba(244, 33, 46, 0.1);
                }
                
                .settings-save-btn.secondary {
                    background: transparent;
                    border: 1px solid var(--color-border);
                    color: var(--color-text);
                }
                .settings-save-btn.secondary:hover {
                    border-color: var(--color-primary);
                    color: var(--color-primary);
                }
            `}</style>
        </div>
    );
};

export default AccountsSettings;