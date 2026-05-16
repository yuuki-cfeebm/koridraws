
export function handleNavbarItem() {
  const navbarItems = document.querySelectorAll('.nav-item')

  if (navbarItems) return
  
  let currentPage = window.location.pathname.split('/').pop()
  console.log(currentPage)
  // if(currentPage === "/")

  navbarItems.forEach(item => {
    item.classList.remove('active')

    const linkItem = item.querySelector('a').getAttribute('href')

    if(linkItem) {
      if(linkItem === currentPage) {
        item.classList.add('active')
      } 
    }
  })
}