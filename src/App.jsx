import { useState } from 'react'
import axios from 'axios';
import Swal from 'sweetalert2';

import 'bootstrap/dist/css/bootstrap.min.css';
import './assets/style.css'

const baseURL = import.meta.env.VITE_BASE_URL;
const basePath = import.meta.env.VITE_BASE_PATH;

//sweetalert
const Toast = Swal.mixin({
  toast: true,
  position: "center",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.onmouseenter = Swal.stopTimer;
    toast.onmouseleave = Swal.resumeTimer;
  }
});

function App() {
  const [accountData, setAccountData] = useState({username: '' , password: ''}) //暫存登入資訊
  const [isAuth, setIsAuth] = useState(false) //已登入未登入模板切換 (尚未教到路由、登出尚未串api)
  const [productsData, setProductsData] = useState([]) //所有產品資訊
  const [tempProduct, setTempProduct] = useState() //查看單一產品

  //已登入：驗證登入狀態
  const checkLogin = async () => {
    try {
      const token = document.cookie.replace(/(?:^|;\s*)apiToken\s*=\s*([^;]*).*$|^.*$/,"$1"); 
      axios.defaults.headers.common['Authorization'] = token;
      const res = await axios.post(`${baseURL}/api/user/check`)
      Toast.fire({
        icon: "success",
        title: "驗證成功:帳號已登入",
        text: `success: ${res.data.success}`
      });
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "驗證失敗",
        text: error
      });
    }
  }

  //取得產品列表
  const getProductsList = async () => {
    try {
      const res = await axios.get(`${baseURL}/api/${basePath}/admin/products`)
      setProductsData(res.data.products)

    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "產品資料取得失敗",
        text: error.response.data.message
      });
    }
  }

  //未登入：處理登入input value
  const handleInputChange = (e) => {
    let {id, value} = e.target;
    setAccountData( prevData => ({
      ...prevData,
      [id]: value
    }))
  }

  //未登入：執行登入
  const loginSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${baseURL}/admin/signin` , accountData)
      const {token, expired} = res.data;
      document.cookie = `apiToken=${token}; expires=${ new Date (expired)}`; 
      axios.defaults.headers.common['Authorization'] = token;

      Toast.fire({
        icon: "success",
        title: res.data.message,
        text: `登入帳號：${accountData.username}`
      });
      setIsAuth(true)
      setAccountData('')
      getProductsList()
    } catch (error) {
      Toast.fire({
        icon: "error",
        title: "登入失敗",
        text: error
      });
    }
  }

  return (
    <>
    { isAuth? (
        <div className="container">
          <div className="row my-3">
            <div className="col">
            <button type="submit" className="btn btn-success" onClick={checkLogin}>驗證登入</button>
              <button type="submit" className="btn btn-primary ms-3" onClick={() => {setIsAuth(!isAuth); setTempProduct()}}>登出</button>
            </div>
          </div>
          <div className="row row-cols-2 my-5">
            <div className="col">
              <h1 className="h2 mb-3">產品列表</h1>
              <div className="table-responsive">
                <table className="table align-middle">
                  <thead>
                    <tr>
                      <th scope="col">產品名稱</th>
                      <th scope="col">原價</th>
                      <th scope="col">售價</th>
                      <th scope="col">是否啟用</th>
                      <th scope="col">查看細節</th>
                    </tr>
                  </thead>
                  <tbody>
                    {productsData && productsData.length > 0 ? (
                      productsData.map( item => (
                        <tr key={item.id}>
                          <th scope="row">{item.title}</th>
                          <td>{item.origin_price}</td>
                          <td>{item.price}</td>
                          <td>{item.is_enabled ? <span className="text-success">已啟用</span> : <span className="text-secondary">未啟用</span>}</td>
                          <td><button type="button" className="btn btn-sm btn-primary" onClick={() => setTempProduct(item)}>查看細節</button></td>
                        </tr>
                      ))
                    ) : (
                      <tr><td colSpan="5"><p className="text-center text-secondary my-0">目前沒有產品</p></td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
            </div>
            <div className="col">
              <h1 className="h2 mb-3">單一產品細節</h1>
              { tempProduct ? (
                <div className="card">
                  <img src={tempProduct.imageUrl} className="card-img-top" alt={tempProduct.title}/>
                  <div className="card-body">
                    <h5 className="card-title">{tempProduct.title}<span className="badge bg-primary ms-2">{tempProduct.category}</span></h5>
                    <p className="card-text">產品描述：{tempProduct.description}</p>
                    <p className="card-text">產品內容：{tempProduct.content}</p>
                    <p className="card-text"><del className="text-secondary">{tempProduct.origin_price} 元</del> / {tempProduct.price}元</p>
                    { tempProduct.imagesUrl?.length > 0 ? (
                      <>
                        <h5 className="card-title">更多圖片：</h5>
                        <div className="d-flex flex-wrap mb-3">
                          {tempProduct.imagesUrl?.map((url, index) => (
                            <img key={index} className="images object-fit me-3 mb-3" src={url}  alt="更多圖片" />
                          ))}
                        </div>
                      </>
                    ) : (
                      ""
                    )}
                    
                    <a href="#" className="btn btn-primary" onClick={() => setTempProduct()}>關閉</a>
                  </div>
                </div>
              ) : (
                <p className="text-secondary">請選擇一個產品查看</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="login m-auto my-5 p-5">
          <h1 className="h2 text-center mb-3">歡迎登入</h1>
          <form>
            <div className="form-floating mb-3">
              <input 
                type="email" 
                className="form-control" 
                id="username" 
                placeholder="name@example.com" 
                onChange={(e) => {handleInputChange(e)}}
                required
              />
              <label htmlFor="username">Email address</label>
            </div>
            <div className="form-floating mb-3">
              <input 
                type="password" 
                className="form-control" 
                id="password" 
                placeholder="Password" 
                onChange={(e) => {handleInputChange(e)}}
                required
              />
              <label htmlFor="password">Password</label>
            </div>
            <button type="submit" className="btn btn-lg btn-primary w-100" onClick={ (e) => loginSubmit(e)}>登入</button>
          </form>
        </div>
      )}
    
    </>
  )
}

export default App
