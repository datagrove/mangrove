export const loc = () => {
    const p = window.location.pathname
    return p
}
export const ln = () => {
    
   const p =    window.location.pathname.split('/')
   console.log("ln", p)
   return p[2]
}
