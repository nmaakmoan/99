import { useEffect, useState } from "react";
import { Link, Route, Routes, useNavigate, useParams } from "react-router-dom";
import axios from "axios";
import "./App.css";

const api = axios.create({ baseURL: import.meta.env.VITE_API_URL || "http://127.0.0.1:8000/api" });
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

type Category = { id: number; name: string; slug: string };
type Product = { id: number; name: string; slug: string; description: string; price: string; stock: number; image_url: string; category_name: string };
type CartItem = { id: number; quantity: number; subtotal: string; product: Product };
type Order = { id: number; total: string; status: string; created_at: string; items: {product_name:string; price:string; quantity:number}[] };

function Header() {
  const [count, setCount] = useState(0);
  const [user, setUser] = useState(Boolean(localStorage.getItem("access")));
  useEffect(() => {
    if (user) api.get<CartItem[]>("/cart/").then(r => setCount(r.data.reduce((s, x) => s + x.quantity, 0))).catch(() => setCount(0));
  }, [user]);
  function logout() { localStorage.removeItem("access"); localStorage.removeItem("refresh"); setUser(false); window.location.href = "/"; }
  return <header className="header"><Link className="logo" to="/">SHOP<span>.</span></Link><nav><Link to="/">Каталог</Link><Link to="/cart">Корзина ({count})</Link>{user ? <><Link to="/profile">Кабинет</Link><button className="link-button" onClick={logout}>Выйти</button></> : <Link to="/login">Войти</Link>}</nav></header>;
}

function Catalog() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [error, setError] = useState("");
  async function load() {
    try { const r = await api.get<Product[]>("/products/", { params: { search, category } }); setProducts(r.data); setError(""); }
    catch { setError("Не удалось загрузить каталог. Проверьте, запущен ли backend."); }
  }
  useEffect(() => { api.get<Category[]>("/categories/").then(r => setCategories(r.data)).catch(() => {}); }, []);
  useEffect(() => { load(); }, [search, category]);
  async function add(productId: number) {
    if (!localStorage.getItem("access")) { alert("Сначала войдите в аккаунт"); return; }
    try { await api.post("/cart/", { product_id: productId }); alert("Товар добавлен в корзину"); }
    catch { alert("Не удалось добавить товар"); }
  }
  return <main className="container"><section className="hero"><p className="eyebrow">НОВАЯ КОЛЛЕКЦИЯ</p><h1>Вещи, которые<br/>делают день лучше.</h1><p>Выбирайте качественные товары по хорошим ценам.</p></section>
    <div className="toolbar"><input placeholder="Поиск товаров..." value={search} onChange={e => setSearch(e.target.value)}/><select value={category} onChange={e => setCategory(e.target.value)}><option value="">Все категории</option>{categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}</select></div>
    {error && <p className="error">{error}</p>}<div className="grid">{products.map(p => <article className="card" key={p.id}><Link to={`/product/${p.id}`}><div className="product-image">{p.image_url ? <img src={p.image_url} alt={p.name}/> : <span>SHOP</span>}</div><div className="card-info"><small>{p.category_name}</small><h3>{p.name}</h3><strong>{p.price} ₸</strong></div></Link><button onClick={() => add(p.id)}>В корзину</button></article>)}</div>
    {!products.length && !error && <p className="empty">Товары не найдены. Добавьте товары через Django Admin.</p>}
  </main>;
}

function ProductPage() {
  const { id } = useParams(); const [p, setP] = useState<Product | null>(null);
  useEffect(() => { api.get<Product>(`/products/${id}/`).then(r => setP(r.data)).catch(() => setP(null)); }, [id]);
  async function add() { if (!p) return; if (!localStorage.getItem("access")) { alert("Сначала войдите"); return; } await api.post("/cart/", {product_id:p.id}); alert("Добавлено в корзину"); }
  if (!p) return <main className="container"><p>Загрузка товара или товар не найден.</p></main>;
  return <main className="container detail"><div className="detail-image">{p.image_url ? <img src={p.image_url} alt={p.name}/> : "SHOP"}</div><div><small>{p.category_name}</small><h1>{p.name}</h1><p>{p.description}</p><h2>{p.price} ₸</h2><p>В наличии: {p.stock}</p><button onClick={add}>Добавить в корзину</button></div></main>;
}

function Login() {
  const [username,setUsername]=useState(""); const [password,setPassword]=useState(""); const [register,setRegister]=useState(false); const [email,setEmail]=useState(""); const nav=useNavigate(); const [error,setError]=useState("");
  async function submit(e: React.FormEvent) { e.preventDefault(); setError(""); try {
    if(register) await api.post("/auth/register/",{username,email,password});
    const r=await api.post("/auth/token/",{username,password}); localStorage.setItem("access",r.data.access); localStorage.setItem("refresh",r.data.refresh); nav("/");
  } catch { setError("Проверьте данные. Пароль должен содержать минимум 8 символов."); } }
  return <main className="auth"><form className="panel" onSubmit={submit}><h1>{register?"Создать аккаунт":"Вход"}</h1><input placeholder="Имя пользователя" value={username} onChange={e=>setUsername(e.target.value)} required/>{register&&<input type="email" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} required/>}<input type="password" placeholder="Пароль" value={password} onChange={e=>setPassword(e.target.value)} required/><button>{register?"Зарегистрироваться":"Войти"}</button>{error&&<p className="error">{error}</p>}<button type="button" className="secondary" onClick={()=>setRegister(!register)}>{register?"Уже есть аккаунт? Войти":"Создать аккаунт"}</button></form></main>;
}

function Cart() {
  const [items,setItems]=useState<CartItem[]>([]); const [form,setForm]=useState({full_name:"",phone:"",address:""}); const [message,setMessage]=useState("");
  async function load(){try{const r=await api.get<CartItem[]>("/cart/");setItems(r.data);}catch{setMessage("Войдите, чтобы открыть корзину.");}}
  useEffect(()=>{load();},[]);
  async function change(id:number,quantity:number){await api.patch(`/cart/${id}/`,{quantity});load();}
  async function remove(id:number){await api.delete(`/cart/${id}/`);load();}
  async function checkout(e:React.FormEvent){e.preventDefault();try{await api.post("/orders/create/",form);setMessage("Заказ оформлен!");load();}catch(e:any){setMessage(e.response?.data?.detail||"Не удалось оформить заказ");}}
  const total=items.reduce((s,x)=>s+Number(x.subtotal),0);
  return <main className="container"><h1>Корзина</h1>{message&&<p>{message}</p>}{items.map(x=><div className="cart-row" key={x.id}><div><b>{x.product.name}</b><p>{x.product.price} ₸ за шт.</p></div><div className="quantity"><button onClick={()=>change(x.id,x.quantity-1)} disabled={x.quantity<=1}>−</button>{x.quantity}<button onClick={()=>change(x.id,x.quantity+1)}>+</button></div><b>{x.subtotal} ₸</b><button className="danger" onClick={()=>remove(x.id)}>Удалить</button></div>)}<h2>Итого: {total.toFixed(2)} ₸</h2>{items.length>0&&<form className="checkout" onSubmit={checkout}><h2>Оформление заказа</h2><input placeholder="ФИО" value={form.full_name} onChange={e=>setForm({...form,full_name:e.target.value})} required/><input placeholder="Телефон" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required/><input placeholder="Адрес доставки" value={form.address} onChange={e=>setForm({...form,address:e.target.value})} required/><button>Подтвердить заказ</button></form>}</main>;
}

function Profile() {
  const [data,setData]=useState<any>(null); const [orders,setOrders]=useState<Order[]>([]);
  useEffect(()=>{api.get("/profile/").then(r=>setData(r.data)).catch(()=>{});api.get<Order[]>("/orders/").then(r=>setOrders(r.data)).catch(()=>{});},[]);
  if(!data)return <main className="container"><p>Войдите в аккаунт, чтобы открыть личный кабинет.</p></main>;
  return <main className="container"><h1>Личный кабинет</h1><section className="panel"><p>Пользователь: <b>{data.username}</b></p><p>Email: {data.email}</p></section><h2>История заказов</h2>{orders.map(o=><section className="panel order" key={o.id}><b>Заказ #{o.id}</b><span>{o.status}</span><span>{o.total} ₸</span><small>{new Date(o.created_at).toLocaleString()}</small>{o.items.map((i,n)=><p key={n}>{i.product_name} × {i.quantity}</p>)}</section>)}{!orders.length&&<p>Заказов пока нет.</p>}</main>;
}

export default function App() {
  return <><Header/><Routes><Route path="/" element={<Catalog/>}/><Route path="/product/:id" element={<ProductPage/>}/><Route path="/login" element={<Login/>}/><Route path="/cart" element={<Cart/>}/><Route path="/profile" element={<Profile/>}/></Routes><footer>SHOP. — интернет-магазин</footer></>;
}
