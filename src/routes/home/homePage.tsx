import styles from "./homePage.module.css";
import { useEffect, useState } from "react";

import email from "../../assets/images/email.svg";
import hammer from "../../assets/images/hammer.svg";
import machine_learning from "../../assets/images/machine-learning.svg";
import network from "../../assets/images/network.svg";
import coding from "../../assets/images/coding.svg";
import cybr from "../../assets/images/cybr.svg";


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
                    <a href={links[0]}><img src={network}
                                            alt="NWEN"
                                            className={styles.fitImage}/></a>
                    <div className={styles.imageName}>NWEN</div>
                </div>

                <div className={styles.imageBox}>
                    <a href={links[1]}><img
                        src={machine_learning} alt="aiml" className={styles.fitImage}/></a>
                    <div className={styles.imageName}>AIML</div>
                </div>

                <div className={styles.imageBox}>
                    <a href={links[2]}><img
                        src={hammer} alt="SWEN" className={styles.fitImage}/></a>
                    <div className={styles.imageName}>SWEN</div>
                </div>

                <div className={styles.imageBox}>
                    <a href={links[3]}><img
                        src={cybr} alt="CYBR" className={styles.fitImage}/></a>
                    <div className={styles.imageName}>CYBR</div>
                </div>

            </div>


            <br/>
            <br/>


            <div className={styles.imageContainer}>
                <div className={styles.imageBox}>
                    <a href={links[4]}><img src={email} alt="email"
                                            className={styles.fitImage}/></a>
                    <div className={styles.imageName}>Email</div>
                </div>

                <div className={styles.imageBox}>
                    <a href={links[5]}><img src={coding} alt="wats"
                                            className={styles.fitImage}/></a>
                    <div className={styles.imageName}>WATS</div>
                </div>

            </div>
        </div>
    );
}
