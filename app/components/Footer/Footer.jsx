import styles from './_Footer.scss';
import React from 'react';

export default class Footer extends React.Component {
  render() {
    var year = (new Date()).getFullYear();
    return (
      <footer className={styles.footer}>
        Folder Tree Project on React-seed, &nbsp; {year}
      </footer>
    );
  }
}
