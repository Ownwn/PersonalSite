import styles from "./homePage.module.css";
import {useEffect, useState} from "react";

import email from "../../assets/images/email.svg";
import coding from "../../assets/images/coding.svg";


export function HomePage() {

    const [links, setLinks] = useState([]);

    useEffect(() => {
        fetch("homePageLink")
            .then(response => {
                if (response.ok) {
                    return response.json();
                }
                throw new Error("Error fetching links :(");
            })
            .then(result => {
                setLinks(result);
            })
            .catch(() => {
                throw new Error("Error processing links :(");
            });
    }, []);

    return (
        <div className={styles.homeBackground}>

            <div className={styles.imageContainer}>
                <div className={styles.imageBox}>
                    <a href={links[0]}><img src={email} alt="email"
                                            className={styles.fitImage}/></a>
                    <div className={styles.imageName}>Email</div>
                </div>

                <div className={styles.imageBox}>
                    <a href={links[1]}><img src={coding} alt="garfield"
                                            className={styles.fitImage}/></a>
                    <div className={styles.imageName}>Garfield</div>
                </div>

            </div>
        </div>
    );
}
