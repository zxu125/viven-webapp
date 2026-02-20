import { useEffect, useState } from "react";
import { nav } from "../app/router.js";
import { api } from "../app/api.js";
import { Edit, MapPin, Pin } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { parseGeoCoords } from "../app/functions.js";
import SelectField from "../components/SelectField.jsx";
import SelectMultiOption from "../components/SelectMultiOption.jsx";

export default function UserDetails() {
    const [regions, setRegions] = useState(null);
    const [roles, setRoles] = useState(null);
    const [regionSelectOpen, setRegionSelectOpen] = useState(false);
    const [user, setUser] = useState({
        id: null,
        name: '',
        phone: '',
        phone2: '',
        totalAmount: 0,
        quantity: 0,
        deliveryNote: '',
        address: '',
        location: null,
    });
    const [isloading, setIsLoading] = useState(true);
    const [mapOpen, setMapOpen] = useState(false);

    const queryClient = useQueryClient();

    useEffect(() => {
        async function _() {
            try {
                let r = await api.get("/region/list")
                setRegions(r.data);
                let roles = await api.get("/user/roles")
                setRoles(roles.data);
                setIsLoading(false);
            } catch (e) {
                alert(JSON.stringify(e))
            }
        }
        _()
    }, []);

    if (isloading) return <div style={{ padding: 16 }}>Loading...</div>;
    
    return (
        <div>
            <div class="topbar p-16 row space-between">
                <div class="col">
                    <div class="f-xl f-bold">
                        Новый клиент
                    </div>
                </div>
                <div>
                    <div class="row g-8">
                        <button onClick={() => {
                            api.post('/user/add', {
                                name: user.name,
                                phone: user.phone,
                                roleId: user.role?.id,
                                password: user.password,
                                username: user.username,
                                regionIds: user.regions?.map(r => r.id) || [],
                            }).then(() => {
                                queryClient.invalidateQueries(['users']);
                                nav("/users");
                            }).catch(e => {
                                alert('Ошибка при сохранении: ' + JSON.stringify(e.response?.data?.error) || e.response?.data?.message || e.message)
                            }
                            )
                        }} class="btn btn-sm btn-primary">Сохранить</button>
                    </div>
                </div>
            </div>
            <div style={{ height: '85vh', overflow: "scroll" }}>
                <div class="p-16 col g-16">
                    <div class="card">
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Имя</div>
                                <input class="input" value={user.name}
                                    onChange={e => {
                                        // alert(e.target.value)
                                        setUser(s => ({ ...s, name: e.target.value }))
                                    }} />
                            </div>
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Логин</div>
                                <input class="input" value={user.username} onChange={e => setUser(s => ({ ...s, username: e.target.value }))} />
                            </div>
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Пароль</div>
                                <input class="input" value={user.password} onChange={e => setUser(s => ({ ...s, password: e.target.value }))} />
                            </div>
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Номер</div>
                                <input class="input" value={user.phone} onChange={e => setUser(s => ({ ...s, phone: e.target.value }))} />
                            </div>
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Роль</div>
                                <SelectField
                                    title="Выберите роль"
                                    value={user.role?.id}
                                    options={roles?.map(r => ({ label: r.name, value: r.id })) || []}
                                    onChange={(v) => {
                                        let r = roles?.find(r => r.id == v);
                                        setUser(s => ({
                                            ...s,
                                            role: r ?? s.role,
                                        }))
                                    }}></SelectField>
                            </div>
                        </div>
                        <div class="row space-between">
                            <div style={{ width: '100%' }}>
                                <div class="f-sm text-secondary">Регионы</div>
                                <div class="" style={{ marginTop: 6, width: '100%' }}>
                                    {user.regions?.map(r => (
                                        <span class="badge badge-secondary" style={{ margin: 2 }}>
                                            {r.name}
                                        </span>
                                    ))}
                                    <button class="btn btn-sm" onClick={() => setRegionSelectOpen(true)}>
                                        Изменить
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            <SelectMultiOption
                open={regionSelectOpen}
                onClose={() => setRegionSelectOpen(false)}
                title="Выберите регионы"
                value={user.regions?.map(r => r.id) || []}
                options={regions?.map(r => ({ label: r.name, id: r.id })) || []}
                onChange={(v) => {
                    let selectedRegions = regions.filter(r => v.includes(r.id));
                    setUser(s => ({
                        ...s,
                        regions: selectedRegions,
                    }))
                }}
            />
        </div >
    );
}