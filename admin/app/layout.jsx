import { ClerkProvider } from '@clerk/nextjs';
import './shell.css';
export const metadata={title:'Mediqit Admin',description:'Private Mediqit launch-list and student research workspace',robots:{index:false,follow:false},icons:{icon:'/assets/favicon-48.png'}};
export default function RootLayout({children}){
 return <html lang="en"><body><ClerkProvider
 localization={{signIn:{start:{title:'Sign in to Mediqit',titleCombined:'Sign in to Mediqit',subtitle:'Use your authorised account to continue.',subtitleCombined:'Use your authorised account to continue.'}}}}
 appearance={{variables:{colorPrimary:'#0876d7',colorForeground:'#082c61',colorMutedForeground:'#5e7188',colorBackground:'#ffffff',borderRadius:'12px',fontFamily:'Arial, sans-serif'},elements:{cardBox:'mediqit-auth-card',formButtonPrimary:'mediqit-auth-button'}}}
 >{children}</ClerkProvider></body></html>;
}
