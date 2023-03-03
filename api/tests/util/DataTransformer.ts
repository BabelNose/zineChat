import Cookie from 'cookie';

class DataTransformer {
    parseCookieArray(cookies:string[]) {
        const parsedCookies = cookies.map(cookie => Cookie.parse(cookie));
        return parsedCookies.reduce((acc:object, val) => {
            const key = Object.keys(val)[0];
            return { ...acc, [key]: val };
        },{});
    }
}

export default DataTransformer;