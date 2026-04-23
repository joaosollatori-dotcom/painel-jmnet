import React from 'react';
import { motion } from 'framer-motion';

interface LoadingScreenProps {
    message?: string;
    fullScreen?: boolean;
}

const LoadingScreen: React.FC<LoadingScreenProps> = ({
    message = "Sincronizando com TITÃ Cloud...",
    fullScreen = true
}) => {
    return (
        <div className={`loading-overlay ${fullScreen ? 'full-page' : 'container-lock'}`}>
            <div className="futuristic-loader">
                {/* JMnet stylized logo animation */}
                <div className="logo-pulse-wrapper">
                    <motion.div
                        className="pulse-ring"
                        animate={{
                            scale: [1, 1.5, 1],
                            opacity: [0.3, 0.1, 0.3],
                            rotate: [0, 180, 360]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                    />
                    <motion.div
                        className="pulse-ring core"
                        animate={{
                            scale: [0.8, 1.1, 0.8],
                            opacity: [0.5, 0.2, 0.5],
                        }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    />
                    <div className="logo-center">
                        <span className="logo-text">T</span>
                    </div>
                </div>

                <div className="loader-text-section">
                    <motion.div
                        className="loading-bar-outer"
                        initial={{ width: 0 }}
                        animate={{ width: 240 }}
                    >
                        <motion.div
                            className="loading-bar-inner"
                            animate={{
                                x: [-240, 240]
                            }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </motion.div>

                    <motion.p
                        className="loading-message"
                        animate={{ opacity: [0.4, 1, 0.4] }}
                        transition={{ duration: 2, repeat: Infinity }}
                    >
                        {message}
                    </motion.p>

                    <div className="system-status">
                        <span className="status-dot green" />
                        <span className="status-label">SYSTEM_CORE: OK</span>
                        <span className="status-pipe">|</span>
                        <span className="status-label">ENCRYPTION: AES_256</span>
                    </div>
                </div>
            </div>

            <style>{`
                .loading-overlay {
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 9999;
                    background: #000;
                }
                .full-page {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100vw;
                    height: 100vh;
                }
                .container-lock {
                    width: 100%;
                    height: 100%;
                    min-height: 400px;
                    border-radius: 24px;
                }

                .futuristic-loader {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 3rem;
                }

                .logo-pulse-wrapper {
                    position: relative;
                    width: 120px;
                    height: 120px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .pulse-ring {
                    position: absolute;
                    width: 100%;
                    height: 100%;
                    border: 1px solid var(--primary-color);
                    border-radius: 50%;
                    filter: blur(1px);
                    box-shadow: 0 0 20px var(--primary-color);
                }
                .pulse-ring.core {
                    width: 80%;
                    height: 80%;
                    border: 2px solid #fff;
                    box-shadow: 0 0 10px #fff;
                }

                .logo-center {
                    width: 60px;
                    height: 60px;
                    background: linear-gradient(135deg, var(--primary-color), #3b82f6);
                    border-radius: 16px;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    box-shadow: 0 0 30px var(--primary-color);
                    z-index: 10;
                    transform: rotate(45deg);
                }
                .logo-text {
                    font-size: 1.8rem;
                    font-weight: 900;
                    color: #fff;
                    transform: rotate(-45deg);
                    letter-spacing: -1px;
                }

                .loader-text-section {
                    display: flex;
                    flex-direction: column;
                    align-items: center;
                    gap: 1rem;
                }

                .loading-bar-outer {
                    height: 2px;
                    background: rgba(255,255,255,0.05);
                    overflow: hidden;
                    position: relative;
                    border-radius: 4px;
                }
                .loading-bar-inner {
                    position: absolute;
                    width: 100px;
                    height: 100%;
                    background: linear-gradient(90deg, transparent, var(--primary-color), transparent);
                }

                .loading-message {
                    font-size: 0.8rem;
                    font-weight: 800;
                    color: #fff;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    margin: 0;
                }

                .system-status {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    font-family: 'JetBrains Mono', monospace;
                    font-size: 0.65rem;
                    color: #333;
                    font-weight: 600;
                }
                .status-dot {
                    width: 6px;
                    height: 6px;
                    border-radius: 50%;
                }
                .status-dot.green {
                    background: #10b981;
                    box-shadow: 0 0 5px #10b981;
                }
                .status-pipe { color: #1a1a1a; }
            `}</style>
        </div>
    );
};

export default LoadingScreen;
