import './AvatarPicker.css';

const avatars: (string | null)[] = [
    null,
    '/avatars/1.png',
    '/avatars/2.png',
    '/avatars/3.png',
    '/avatars/4.png',
    '/avatars/5.png',
];

interface AvatarPickerProps {
    readonly onClose: () => void;
    readonly onSelect: (photoUrl: string | null) => void;
}

export default function AvatarPicker({ onClose, onSelect }: AvatarPickerProps) {
    return (
        <dialog open className="avatar-picker-overlay" aria-modal="true" aria-labelledby="avatar-picker-title">
            <div className="avatar-picker">
                <div className="avatar-picker-header">
                    <h2 id="avatar-picker-title">Choose your avatar</h2>
                    <button
                        type="button"
                        className="avatar-picker-close"
                        onClick={onClose}
                        aria-label="Close avatar picker"
                    >
                        &times;
                    </button>
                </div>

                <div className="avatar-picker-grid">
                    {avatars.map((photoUrl, index) => (
                        <button
                            type="button"
                            className="avatar-option"
                            onClick={() => onSelect(photoUrl)}
                            aria-label={`Choose avatar ${index}`}
                            key={photoUrl ?? 'random'}
                        >
                            <img src={photoUrl ?? 'https://picsum.photos/96'} alt="" />
                        </button>
                    ))}
                </div>
            </div>
        </dialog>
    );
}
