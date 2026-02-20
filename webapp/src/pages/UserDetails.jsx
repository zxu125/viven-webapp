import { useEffect, useState } from "react";
import { nav } from "../app/router.js";
import { api } from "../app/api.js";
import { Edit, MapPin, Pin } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { parseGeoCoords } from "../app/functions.js";
import SelectField from "../components/SelectField.jsx";
import SelectMultiOption from "../components/SelectMultiOption.jsx";

export default function UserDetails({ query }) {
    // return 'vasya'
    const [user, setUser] = useState(null);
    const [regions, setRegions] = useState(null);
    const [roles, setRoles] = useState(null);
    const [isloading, setIsLoading] = useState(true);
    const [mode, setMode] = useState("view"); // view|edit
    const [mapOpen, setMapOpen] = useState(false);
    const [regionSelectOpen, setRegionSelectOpen] = useState(false);

    const queryClient = useQueryClient();
    useEffect(() => {
        async function _() {
            try {
                let o = await api.get("/user/view?id=" + query.userId)
                o.data.quantity = o.data.stock?.quantity || 0;
                setUser(o.data);
                let r = await api.get("/region/list")
                setRegions(r.data);
                let roles = await api.get("/user/roles")
                setRoles(roles.data);
                setIsLoading(false);
            } catch (e) {
                alert(JSOn.stringify(e))
            }
        }
        _()
    }, [query]);
    if (isloading) return <div style={{ padding: 16 }}>Loading...</div>;
    return (
        <div>
            <div class="topbar p-16 row space-between">
                <div class="col">
                    <div class="f-xl f-bold">
                        Клиент: {user.name}
                    </div>
                </div>
                <div>
                    {mode == 'view' ? <Edit
                        size={22} class="cursor-pointer"
                        onClick={() => setMode('edit')} />
                        :
                        <div class="row g-8">
                            <button onClick={() => setMode('view')} class="btn btn-sm">Отмена</button>

                            <button onClick={() => {
                                api.post('/user/edit', {
                                    id: user.id,
                                    name: user.name,
                                    phone: user.phone,
                                    roleId: user.role?.id,
                                    regionIds: user.regions.map(r => r.id),
                                }).then(() => {
                                    queryClient.invalidateQueries(['users']);
                                    nav("/users");
                                }).catch(e => {
                                    alert(e.response?.data?.message || e.message || 'Ошибка при сохранении' + JSON.stringify(e))
                                }
                                )
                            }} class="btn btn-sm btn-primary">Сохранить</button>
                        </div>
                    }
                </div>
            </div>
            <div style={{ height: '85vh', overflow: "scroll" }}>
                {mode == 'view' ? <div class="p-16 col g-16">
                    <div class="card">
                        <div class="f-lg f-bold text-primary" style={{ marginBottom: 6 }}>
                            Инфо
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Имя</div>
                                <div class="f-lg f-semibold">{user.name}</div>
                            </div>
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Номер</div>
                                <div class="f-lg f-semibold">{user.phone}</div>
                            </div>
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Роль</div>
                                <div class="f-lg f-semibold">{user.role?.name}</div>
                            </div>
                        </div>
                        <div class="row space-between">
                            <div>
                                <div class="f-sm text-secondary">Регионы</div>
                                <div class="f-lg f-semibold">{user.regions?.map(r => r.name).join(', ')}</div>
                            </div>
                        </div>
                    </div>
                    <button class="btn" onClick={() => nav('/order/history', { query: { userId: user.id, name: user.name } })}>
                        История дотовакок
                    </button>
                </div>
                    :
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
                                <div style={{width:'100%'}}>
                                    <div class="f-sm text-secondary">Регионы</div>
                                    <div class="" style={{ marginTop: 6, width:'100%' }}>
                                        {user.regions?.map(r => (
                                            <span class="badge badge-secondary" style={{margin:2}}>
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
                }
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