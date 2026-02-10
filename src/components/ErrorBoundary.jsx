import React from 'react';

class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true };
    }

    componentDidCatch(error, errorInfo) {
        console.error("TitleBar Error:", error, errorInfo);
    }

    handleClose = () => {
        if (window.api && window.api.window) {
            window.api.window.close();
        } else {
            window.close();
        }
    }

    render() {
        if (this.state.hasError) {
             
            return (
                <div style={{
                    height: '32px',
                    background: '#2c0b0e',  
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 10px',
                    color: '#ff6b6b',
                    fontSize: '12px',
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    right: 0,
                    zIndex: 99999,
                    borderBottom: '1px solid #ff6b6b',
                    WebkitAppRegion: 'drag'  
                }}>
                    <span>Ошибка TitleBar</span>
                    <button 
                        onClick={this.handleClose}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: '#fff',
                            cursor: 'pointer',
                            fontWeight: 'bold',
                            WebkitAppRegion: 'no-drag',
                            padding: '4px 8px'
                        }}
                    >
                        ✕
                    </button>
                </div>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;