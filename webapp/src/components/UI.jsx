import { Plus } from "lucide-react";

function AddButton({ onClick }) {
    return (
        <div onClick={onClick}
            style={{
                width: 45,
                height: 45,
                borderRadius: '50%',
                backgroundColor: '#007bff',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
            }}
        >
            <Plus size={29} color="white" />
        </div>
    );
}

export { AddButton }