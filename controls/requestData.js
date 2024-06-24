export const requestData = (action, params) => {
    let result = [];

    switch (action) {
        case 'analyseData':
            // params can also be used if need
            // fetch from OMS
            result = [
                { id: 1, date: new Date(), qty: 10, price: 100, userId: 1 },
                { id: 2, date: new Date(), qty: 30, price: 300, userId: 4 },
                { id: 3, date: new Date(), qty: 20, price: 200, userId: 5 }
            ]
            break;
    }

    return result;
}