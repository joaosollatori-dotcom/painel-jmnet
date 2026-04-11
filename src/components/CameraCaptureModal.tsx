import React, { useState, useEffect, useRef } from 'react';
import { Camera, X, CheckSquareOffset, ArrowCounterClockwise } from '@phosphor-icons/react';
import { motion, AnimatePresence } from 'framer-motion';
import './CameraCaptureModal.css';

interface CameraCaptureModalProps {
    onClose: () => void;
    onCapture: (file: File) => void;
}

const CameraCaptureModal: React.FC<CameraCaptureModalProps> = ({ onClose, onCapture }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
    const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [permissionGranted, setPermissionGranted] = useState<boolean>(false);
    const [error, setError] = useState<string>('');
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [needsSelection, setNeedsSelection] = useState<boolean>(false);

    useEffect(() => {
        setupCamera();
        return () => {
            stopStream();
        };
    }, []);

    const stopStream = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current && videoRef.current.srcObject) {
            const currentStream = videoRef.current.srcObject as MediaStream;
            currentStream.getTracks().forEach(track => track.stop());
            videoRef.current.srcObject = null;
        }
    };

    const setupCamera = async () => {
        try {
            // Solicita permissões de áudio e vídeo como exigido
            const initialStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
            setPermissionGranted(true);

            // Pausa a stream inicial porque vamos selecionar um dispositivo específico
            initialStream.getTracks().forEach(track => track.stop());

            const allDevices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = allDevices.filter(device => device.kind === 'videoinput');
            setDevices(videoDevices);

            const savedDeviceId = localStorage.getItem('preferred_camera_id');

            // Verifica se a câmera salva ainda existe
            if (savedDeviceId && videoDevices.some(d => d.deviceId === savedDeviceId)) {
                await startStream(savedDeviceId);
            } else if (videoDevices.length > 1) {
                // Mais de uma câmera disponivel e não há preferencia ou preferência inválida
                setNeedsSelection(true);
                setSelectedDeviceId(videoDevices[0].deviceId);
            } else if (videoDevices.length === 1) {
                // Apenas uma câmera, salvar a escolha automaticamente e usar
                const deviceId = videoDevices[0].deviceId;
                localStorage.setItem('preferred_camera_id', deviceId);
                await startStream(deviceId);
            } else {
                setError('Nenhuma câmera de vídeo encontrada.');
            }
        } catch (err: any) {
            setError('Permissão de câmera/áudio negada ou não disponível.');
            console.error(err);
        }
    };

    const startStream = async (deviceId: string) => {
        stopStream();
        try {
            const newStream = await navigator.mediaDevices.getUserMedia({
                video: { deviceId: { exact: deviceId } },
                // Para capturar a imagem não vamos salvar o áudio, 
                // mas pedimos permissão de vídeo no stream final.
            });
            setStream(newStream);
            if (videoRef.current) {
                videoRef.current.srcObject = newStream;
            }
        } catch (err) {
            console.error('Error starting stream:', err);
            setError('Erro ao iniciar a câmera selecionada.');
        }
    };

    const handleSaveSelection = async () => {
        if (!selectedDeviceId) return;
        localStorage.setItem('preferred_camera_id', selectedDeviceId);
        setNeedsSelection(false);
        await startStream(selectedDeviceId);
    };

    const handleTakePhotos = () => {
        if (videoRef.current && canvasRef.current) {
            const video = videoRef.current;
            const canvas = canvasRef.current;
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                const dataUrl = canvas.toDataURL('image/jpeg', 0.9);
                setCapturedImage(dataUrl);
            }
        }
    };

    const handleRetake = () => {
        setCapturedImage(null);
        // Continuamos com a stream já rodando em background if not stopped, 
        // mas é bom garantir re-inicialização caso parada
        /* if (!stream || stream.getTracks().some(t => t.readyState === 'ended')) {
            const deviceId = localStorage.getItem('preferred_camera_id');
            if (deviceId) {
                startStream(deviceId);
            }
        } */
    };

    const handleConfirm = () => {
        if (!capturedImage) return;
        fetch(capturedImage)
            .then(res => res.blob())
            .then(blob => {
                const file = new File([blob], `photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
                onCapture(file);
                onClose();
            });
    };

    return (
        <div className="camera-modal-overlay">
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className="camera-modal">
                <div className="camera-modal-header">
                    <h3>Captura de Câmera</h3>
                    <button className="camera-close-btn" onClick={() => { stopStream(); onClose(); }}>
                        <X size={20} weight="bold" />
                    </button>
                </div>

                <div className="camera-modal-body">
                    {error ? (
                        <div className="camera-error">{error}</div>
                    ) : !permissionGranted ? (
                        <div className="camera-loading">Solicitando permissões de Câmera e Áudio...</div>
                    ) : needsSelection ? (
                        <div className="camera-selection">
                            <p>Selecionar câmera principal</p>
                            <span className="camera-selection-hint">Esta será sua câmera padrão no sistema e a escolha não poderá ser alterada por aqui posteriormente.</span>
                            <select value={selectedDeviceId} onChange={e => setSelectedDeviceId(e.target.value)}>
                                {devices.map(d => (
                                    <option key={d.deviceId} value={d.deviceId}>{d.label || `Câmera (${d.deviceId.slice(0, 5)}...)`}</option>
                                ))}
                            </select>
                            <div className="camera-modal-actions mt-3">
                                <button className="camera-confirm primary" onClick={handleSaveSelection}>
                                    Salvar e Continuar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="camera-preview-container">
                            <video ref={videoRef} autoPlay playsInline muted className="camera-video-element" style={{ display: capturedImage ? 'none' : 'block' }} />

                            {!capturedImage ? (
                                <button className="camera-capture-trigger flex-center" onClick={handleTakePhotos}>
                                    <div className="camera-shutter"></div>
                                </button>
                            ) : (
                                <>
                                    <img src={capturedImage} alt="Captured" className="camera-video-element" />
                                    <div className="camera-modal-actions">
                                        <button className="camera-cancel" onClick={handleRetake}>
                                            <ArrowCounterClockwise size={20} /> Deletar e Tirar Outra
                                        </button>
                                        <button className="camera-confirm primary" onClick={handleConfirm}>
                                            <CheckSquareOffset size={20} /> Enviar Foto
                                        </button>
                                    </div>
                                </>
                            )}
                            {/* Hidden canvas to extract the image */}
                            <canvas ref={canvasRef} style={{ display: 'none' }}></canvas>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};

export default CameraCaptureModal;
