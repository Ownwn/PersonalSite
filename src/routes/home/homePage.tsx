import styles from "./homePage.module.css";
import {useEffect, useState} from "react";

import email from "../../assets/images/email.svg";
import coding from "../../assets/images/coding.svg";
import cybr from "../../assets/images/cybr.svg";
import grades from "../../assets/images/grades.svg";
import network from "../../assets/images/network.svg";
import ticket from "../../assets/images/ticket.svg";


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
                    <a href={links[1]}><img src={cybr} alt="cybr"
                                            className={styles.fitImage}/></a>
                    <div className={styles.imageName}>CYBR</div>
                </div>

                <div className={styles.imageBox}>
                    <a href={links[2]}><img src={ticket} alt="ticket"
                                            className={styles.fitImage}/></a>
                    <div className={styles.imageName}>SPAN</div>
                </div>
            </div>

            <div className={styles.imageContainer}>
                <div className={styles.imageBox}>
                    <a href={links[3]}><img src={coding} alt="coding"
                                            className={styles.fitImage}/></a>
                    <div className={styles.imageName}>SWEN</div>
                </div>

                <div className={styles.imageBox}>
                    <a href={links[4]}><img src={network} alt="network"
                                            className={styles.fitImage}/></a>
                    <div className={styles.imageName}>SWEN4</div>
                </div>

                <div className={styles.imageBox}>
                    <a href={links[5]}><img src={grades} alt="grades"
                                            className={styles.fitImage}/></a>
                    <div className={styles.imageName}>MARK</div>
                </div>
            </div>





        </div>
    );
}
